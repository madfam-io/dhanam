import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthTokens, UserProfile, Locale } from '@dhanam/shared';
import { apiClient } from '../api/client';
import { authApi } from '../api/auth';
import { getJanuaApiUrl } from '../janua-oauth';

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

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      setAuth: (user, tokens) => {
        apiClient.setTokens(tokens);
        set({ user, tokens, token: tokens.accessToken, isAuthenticated: true });
      },

      clearAuth: () => {
        apiClient.clearTokens();
        set({ user: null, tokens: null, token: null, isAuthenticated: false });
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
        console.log('[useAuth] refreshUser called, hasTokens:', !!tokens?.accessToken);
        if (!tokens?.accessToken) {
          console.log('[useAuth] refreshUser: No access token, returning early');
          return;
        }

        try {
          const apiUrl = getJanuaApiUrl();
          console.log('[useAuth] refreshUser: Fetching from', `${apiUrl}/api/v1/auth/me`);
          // Fetch user profile from Janua's /auth/me endpoint
          const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch user profile from Janua');
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
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        try {
          if (state?.tokens) {
            apiClient.setTokens(state.tokens);
          }
        } catch (error) {
          console.error('[useAuth] Error during rehydration token setup:', error);
        } finally {
          // ALWAYS mark hydration complete, even if token setup fails
          useAuth.getState().setHasHydrated(true);
        }
      },
    }
  )
);

// Safety net: Force hydration complete after timeout
// This guarantees skeleton cannot persist indefinitely regardless of edge cases
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const state = useAuth.getState();
    if (!state._hasHydrated) {
      console.warn('[useAuth] Hydration timeout - forcing completion');
      state.setHasHydrated(true);
    }
  }, 2000);
}
