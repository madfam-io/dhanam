'use client';

import { create } from 'zustand';
import posthog from 'posthog-js';
import type { AuthTokens, UserProfile, Locale } from '@dhanam/shared';
import { apiClient } from '../api/client';
import { authApi } from '../api/auth';

const JANUA_API_URL = process.env.NEXT_PUBLIC_JANUA_API_URL || 'https://auth.madfam.io';

/**
 * AuthState — the public interface consumed by 38+ components.
 *
 * This was previously a Zustand store with localStorage persistence.
 * Now it is a plain (non-persisted) Zustand store whose state is
 * populated by Janua SDK hooks via <JanuaAuthSync /> in the provider
 * tree, or imperatively via setAuth() for demo / guest flows.
 *
 * The Zustand store is kept solely so that:
 *   1. React components can subscribe via useAuth() (hook)
 *   2. Non-component code can call useAuth.getState() / .setState()
 *      (e.g. apiClient, landing-page async callbacks)
 */
interface AuthState {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;

  setAuth: (user: UserProfile, tokens: AuthTokens) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getToken: () => Promise<string | null>;
  setHasHydrated: (state: boolean) => void;
}

// Hydrate initial state from Janua localStorage tokens (if present).
// This runs synchronously at store creation, before any React render,
// ensuring API calls in React Query hooks have the auth token available.
function getInitialAuthState(): Pick<AuthState, 'user' | 'tokens' | 'token' | 'isAuthenticated'> {
  if (typeof window === 'undefined') {
    return { user: null, tokens: null, token: null, isAuthenticated: false };
  }

  const januaToken = localStorage.getItem('janua_access_token');
  if (!januaToken) {
    return { user: null, tokens: null, token: null, isAuthenticated: false };
  }

  try {
    const parts = januaToken.split('.');
    if (parts.length !== 3 || !parts[1]) throw new Error('bad format');

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.sub || !payload.exp || payload.exp * 1000 < Date.now()) {
      throw new Error('invalid or expired');
    }

    const user: UserProfile = {
      id: payload.sub,
      email: payload.email || '',
      name: payload.name || payload.email?.split('@')[0] || 'User',
      locale: (payload.locale?.startsWith('es') ? 'es' : 'en') as Locale,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      totpEnabled: payload.mfa_enabled || false,
      emailVerified: payload.email_verified || true,
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      spaces: [],
    };

    const tokens: AuthTokens = {
      accessToken: januaToken,
      refreshToken: localStorage.getItem('janua_refresh_token') || '',
      expiresIn: payload.exp - Math.floor(Date.now() / 1000),
    };

    // Wire the token into the API client immediately
    apiClient.setTokens(tokens);

    return { user, tokens, token: januaToken, isAuthenticated: true };
  } catch {
    return { user: null, tokens: null, token: null, isAuthenticated: false };
  }
}

const initialAuth = getInitialAuthState();

export const useAuth = create<AuthState>()((set, get) => ({
  ...initialAuth,
  isLoading: false,
  _hasHydrated: true,

  setHasHydrated: (state) => {
    set({ _hasHydrated: state });
  },

  setAuth: (user, tokens) => {
    apiClient.setTokens(tokens);
    set({ user, tokens, token: tokens.accessToken, isAuthenticated: true });

    // Identify user in PostHog with Janua UUID for cross-product analytics
    if (typeof window !== 'undefined' && user?.id && posthog.__loaded) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        product: 'dhanam',
        subscription_tier: user.subscriptionTier,
      });
    }

    // Set cookie marker for middleware detection (prevents redirect flash)
    // Use Domain=.dhan.am for cross-subdomain auth (app.dhan.am + admin.dhan.am)
    if (typeof document !== 'undefined') {
      const isProduction = window.location.hostname.endsWith('.dhan.am');
      const domainAttr = isProduction ? ' Domain=.dhan.am;' : '';
      document.cookie = `auth-storage=true; path=/;${domainAttr} max-age=604800; SameSite=Lax`;
    }
  },

  clearAuth: () => {
    apiClient.clearTokens();
    set({ user: null, tokens: null, token: null, isAuthenticated: false });

    // Clear cookie marker for middleware detection
    // Use Domain=.dhan.am for cross-subdomain auth (app.dhan.am + admin.dhan.am)
    if (typeof document !== 'undefined') {
      const isProduction = window.location.hostname.endsWith('.dhan.am');
      const domainAttr = isProduction ? ' Domain=.dhan.am;' : '';
      document.cookie = `auth-storage=; path=/;${domainAttr} max-age=0; SameSite=Lax`;
    }
  },

  logout: async () => {
    const { tokens, clearAuth } = get();
    if (tokens?.refreshToken) {
      try {
        await authApi.logout(tokens.refreshToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    clearAuth();
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.reset();
    }
  },

  refreshTokens: async () => {
    const { tokens, setAuth, clearAuth } = get();
    if (!tokens?.refreshToken) {
      clearAuth();
      return;
    }

    try {
      const response = await authApi.refresh(tokens.refreshToken);
      setAuth(response.user, response.tokens);
    } catch (error) {
      clearAuth();
      throw error;
    }
  },

  refreshUser: async () => {
    const { tokens, setAuth } = get();
    if (!tokens?.accessToken) {
      return;
    }

    try {
      // First, try to fetch from Dhanam API which has full profile + subscriptionTier
      const dhanamApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dhan.am/v1';
      const dhanamResponse = await fetch(`${dhanamApiUrl}/users/me`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (dhanamResponse.ok) {
        const dhanamData = await dhanamResponse.json();
        const userProfile: UserProfile = dhanamData.data || dhanamData;
        setAuth(userProfile, tokens);
        return;
      }

      // Fallback to Janua if Dhanam API fails (e.g., user not synced yet)
      const januaApiUrl = JANUA_API_URL;
      const response = await fetch(`${januaApiUrl}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      const januaUser = data.user || data;

      // Map Janua user to Dhanam UserProfile format
      const userProfile: UserProfile = {
        id: januaUser.id,
        email: januaUser.email,
        name: januaUser.name || januaUser.display_name || januaUser.email.split('@')[0],
        locale: (januaUser.locale as Locale) || 'en',
        timezone: januaUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        totpEnabled: januaUser.mfa_enabled || false,
        emailVerified: januaUser.email_verified || false,
        onboardingCompleted: true, // SSO users are considered onboarded
        subscriptionTier: 'community', // Default for Janua-only users
        createdAt: januaUser.created_at || new Date().toISOString(),
        updatedAt: januaUser.updated_at || new Date().toISOString(),
        spaces: [], // Spaces will be loaded separately
      };

      setAuth(userProfile, tokens);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  },

  getToken: async () => {
    const { tokens } = get();
    return tokens?.accessToken || null;
  },
}));
