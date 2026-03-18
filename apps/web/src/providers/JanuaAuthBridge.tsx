'use client';

import { useEffect, useCallback, useState } from 'react';
import { JanuaProvider, useAuth as useJanuaAuth, useSession, useUser } from '@janua/react-sdk';
import { useAuth } from '~/lib/hooks/use-auth';
import type { UserProfile, AuthTokens, Locale } from '@dhanam/shared';

const januaConfig: React.ComponentProps<typeof JanuaProvider>['config'] = {
  baseURL: process.env.NEXT_PUBLIC_JANUA_API_URL || 'http://localhost:3001',
  clientId: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || 'dhanam-web',
  redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3040'}/auth/callback`,
  debug: process.env.NODE_ENV !== 'production',
};

/**
 * JanuaAuthSync - Syncs Janua SSO state with Dhanam's existing auth store
 *
 * Uses SDK hooks (useAuth, useSession, useUser) instead of manual
 * localStorage/JWT parsing. Preserves the Zustand setAuth() call so
 * all 38+ consumer components and the middleware cookie continue working.
 */
function JanuaAuthSync({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded: authLoaded } = useJanuaAuth();
  const { session } = useSession();
  const { user: januaUser } = useUser();
  const { setAuth, clearAuth, isAuthenticated: dhanamAuthenticated, _hasHydrated } = useAuth();

  const syncAuthState = useCallback(() => {
    // Don't make auth decisions until both SDK and Zustand are ready
    if (!authLoaded || !_hasHydrated) {
      return;
    }

    if (isSignedIn && januaUser) {
      const mapLocale = (januaLocale?: string): Locale => {
        if (januaLocale?.startsWith('es')) return 'es';
        return 'en';
      };

      const dhanamUser: UserProfile = {
        id: januaUser.id,
        email: januaUser.email,
        name: januaUser.name || januaUser.display_name || januaUser.email.split('@')[0] || 'User',
        locale: mapLocale(januaUser.locale),
        timezone: januaUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        totpEnabled: januaUser.mfa_enabled || false,
        emailVerified: januaUser.email_verified || false,
        onboardingCompleted: true,
        createdAt: januaUser.created_at || new Date().toISOString(),
        updatedAt: januaUser.updated_at || new Date().toISOString(),
        spaces: [],
      };

      // Get tokens from SDK session instead of localStorage
      const tokens: AuthTokens = {
        accessToken: session?.accessToken || '',
        refreshToken: session?.refreshToken || '',
        expiresIn: session?.expiresAt
          ? Math.floor((session.expiresAt - Date.now()) / 1000)
          : 15 * 60,
      };

      setAuth(dhanamUser, tokens);
    } else if (!isSignedIn && dhanamAuthenticated) {
      // Janua SDK doesn't detect a session, but Dhanam thinks we're authenticated.
      // This can happen legitimately when:
      //   1. User logged in via direct PKCE flow (tokens stored manually, not via SDK)
      //   2. User is in demo mode (authenticated via Dhanam API, not Janua)
      // Only clear auth if neither case applies.
      const hasJanuaToken =
        typeof window !== 'undefined' && localStorage.getItem('janua_access_token');
      const isDemoMode =
        typeof document !== 'undefined' && document.cookie.includes('demo-mode=true');

      if (!hasJanuaToken && !isDemoMode) {
        clearAuth();
      }
    }
  }, [
    authLoaded,
    _hasHydrated,
    isSignedIn,
    januaUser,
    session,
    dhanamAuthenticated,
    setAuth,
    clearAuth,
  ]);

  useEffect(() => {
    syncAuthState();
  }, [syncAuthState]);

  return <>{children}</>;
}

interface JanuaAuthBridgeProps {
  children: React.ReactNode;
}

/**
 * JanuaAuthBridge Provider
 *
 * Wraps JanuaProvider and syncs its auth state with Dhanam's local auth.
 * Place this OUTSIDE of Dhanam's AuthProvider in the provider hierarchy.
 */
export function JanuaAuthBridge({ children }: JanuaAuthBridgeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Skip JanuaProvider during SSR — it accesses browser APIs (window/localStorage)
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <JanuaProvider config={januaConfig}>
      <JanuaAuthSync>{children}</JanuaAuthSync>
    </JanuaProvider>
  );
}
