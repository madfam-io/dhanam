'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@dhanam/shared';
import { ThemeProvider } from '~/components/theme-provider';
import { AuthProvider } from '~/components/auth-provider';
import { PreferencesProvider } from '~/contexts/PreferencesContext';
import PostHogProvider from '~/providers/PostHogProvider';
import { useState, useEffect, useCallback, type ComponentType } from 'react';
import { CookieConsentBanner } from '~/components/cookie-consent-banner';

/**
 * SSR-safe wrapper: @janua/react-sdk accesses browser APIs at module level,
 * crashing SSR and collapsing the entire provider tree. This wrapper:
 * - SSR: renders children directly (no @janua/react-sdk loaded)
 * - Client: dynamically imports JanuaProvider + JanuaAuthSync after mount
 *
 * Replaces the former JanuaAuthBridge with a direct JanuaProvider wrapping
 * a lightweight sync component that pushes Janua SDK state into the
 * Dhanam useAuth() Zustand store.
 */
function SSRSafeJanuaProvider({ children }: { children: React.ReactNode }) {
  const [Wrapper, setWrapper] = useState<ComponentType<{ children: React.ReactNode }> | null>(null);

  useEffect(() => {
    Promise.all([import('@janua/react-sdk'), import('~/lib/hooks/use-auth')]).then(
      ([januaSdk, authModule]) => {
        const { JanuaProvider, useAuth: useJanuaAuth, useSession, useUser } = januaSdk;
        const { useAuth } = authModule;

        const januaConfig = {
          baseURL: process.env.NEXT_PUBLIC_JANUA_API_URL || 'http://localhost:3001',
          clientId: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || 'dhanam-web',
          redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3040'}/auth/callback`,
          debug: process.env.NODE_ENV !== 'production',
        };

        /**
         * JanuaAuthSync — syncs Janua SDK state into Dhanam's useAuth() store.
         *
         * Replaces the former JanuaAuthBridge sync component. Runs inside
         * JanuaProvider so Janua hooks are available.
         */
        function JanuaAuthSync({ children: syncChildren }: { children: React.ReactNode }) {
          const { isSignedIn, isLoaded: authLoaded } = useJanuaAuth();
          const { session } = useSession();
          const { user: januaUser } = useUser();
          const { setAuth, clearAuth, isAuthenticated: dhanamAuthenticated } = useAuth();

          const syncAuthState = useCallback(() => {
            if (!authLoaded) return;

            if (isSignedIn && januaUser) {
              const mapLocale = (januaLocale?: string): import('@dhanam/shared').Locale => {
                if (januaLocale?.startsWith('es')) return 'es';
                return 'en';
              };

              const dhanamUser: import('@dhanam/shared').UserProfile = {
                id: januaUser.id,
                email: januaUser.email,
                name:
                  januaUser.name ||
                  januaUser.display_name ||
                  januaUser.email.split('@')[0] ||
                  'User',
                locale: mapLocale(januaUser.locale),
                timezone: januaUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                totpEnabled: januaUser.mfa_enabled || false,
                emailVerified: januaUser.email_verified || false,
                onboardingCompleted: true,
                createdAt: januaUser.created_at || new Date().toISOString(),
                updatedAt: januaUser.updated_at || new Date().toISOString(),
                spaces: [],
              };

              const tokens: import('@dhanam/shared').AuthTokens = {
                accessToken: session?.accessToken || '',
                refreshToken: session?.refreshToken || '',
                expiresIn: session?.expiresAt
                  ? Math.floor((session.expiresAt - Date.now()) / 1000)
                  : 15 * 60,
              };

              setAuth(dhanamUser, tokens);

              // Set cookie for middleware auth check
              if (typeof document !== 'undefined') {
                document.cookie =
                  'auth-storage=authenticated; path=/; max-age=86400; SameSite=Lax; Secure';
              }
            } else if (!isSignedIn && !dhanamAuthenticated) {
              // SDK hooks don't reflect login — fall back to localStorage tokens
              const januaToken =
                typeof window !== 'undefined' ? localStorage.getItem('janua_access_token') : null;

              if (januaToken) {
                try {
                  const payloadStr = januaToken.split('.')[1];
                  if (!payloadStr) throw new Error('Invalid token');
                  const payload = JSON.parse(atob(payloadStr));
                  const januaRefresh = localStorage.getItem('janua_refresh_token') || '';

                  const fallbackUser: import('@dhanam/shared').UserProfile = {
                    id: payload.sub,
                    email: payload.email || '',
                    name: payload.name || payload.email?.split('@')[0] || 'User',
                    locale: 'en',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    totpEnabled: false,
                    emailVerified: payload.email_verified || true,
                    onboardingCompleted: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    spaces: [],
                  };

                  const fallbackTokens: import('@dhanam/shared').AuthTokens = {
                    accessToken: januaToken,
                    refreshToken: januaRefresh,
                    expiresIn: payload.exp ? payload.exp - Math.floor(Date.now() / 1000) : 15 * 60,
                  };

                  setAuth(fallbackUser, fallbackTokens);

                  if (typeof document !== 'undefined') {
                    document.cookie =
                      'auth-storage=authenticated; path=/; max-age=86400; SameSite=Lax; Secure';
                  }
                } catch {
                  // Token parse failed — ignore
                }
              }
            } else if (!isSignedIn && dhanamAuthenticated) {
              // Only clear when Janua says "not signed in" AND there is no
              // out-of-band session (direct PKCE tokens or demo mode)
              const hasJanuaToken =
                typeof window !== 'undefined' && localStorage.getItem('janua_access_token');
              const isDemoMode =
                typeof document !== 'undefined' && document.cookie.includes('demo-mode=true');

              if (!hasJanuaToken && !isDemoMode) {
                clearAuth();
                if (typeof document !== 'undefined') {
                  document.cookie = 'auth-storage=; path=/; max-age=0; SameSite=Lax; Secure';
                }
              }
            }
          }, [authLoaded, isSignedIn, januaUser, session, dhanamAuthenticated, setAuth, clearAuth]);

          useEffect(() => {
            syncAuthState();
          }, [syncAuthState]);

          return <>{syncChildren}</>;
        }

        // Build the combined wrapper component
        function JanuaWrapper({ children: wrapperChildren }: { children: React.ReactNode }) {
          return (
            <JanuaProvider config={januaConfig}>
              <JanuaAuthSync>{wrapperChildren}</JanuaAuthSync>
            </JanuaProvider>
          );
        }

        setWrapper(() => JanuaWrapper);
      }
    );
  }, []);

  if (!Wrapper) {
    return <>{children}</>;
  }

  return <Wrapper>{children}</Wrapper>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            <SSRSafeJanuaProvider>
              <AuthProvider>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- Reason: React 19 type incompatibility with PreferencesProvider children prop */}
                <PreferencesProvider>{children as any}</PreferencesProvider>
              </AuthProvider>
            </SSRSafeJanuaProvider>
            <CookieConsentBanner />
          </PostHogProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
