'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@dhanam/shared';
import { ThemeProvider } from '~/components/theme-provider';
import { AuthProvider } from '~/components/auth-provider';
import { PreferencesProvider } from '~/contexts/PreferencesContext';
import PostHogProvider from '~/providers/PostHogProvider';
import { useState, useEffect, type ComponentType } from 'react';
import { CookieConsentBanner } from '~/components/cookie-consent-banner';

/**
 * SSR-safe wrapper: @janua/react-sdk accesses browser APIs at module level,
 * crashing SSR and collapsing the entire provider tree. This wrapper:
 * - SSR: renders children directly (no @janua/react-sdk loaded)
 * - Client: dynamically imports JanuaAuthBridge after mount
 */
function SSRSafeJanuaAuthBridge({ children }: { children: React.ReactNode }) {
  const [Bridge, setBridge] = useState<ComponentType<{ children: React.ReactNode }> | null>(null);

  useEffect(() => {
    import('~/providers/JanuaAuthBridge').then((mod) => {
      setBridge(() => mod.JanuaAuthBridge);
    });
  }, []);

  if (!Bridge) {
    return <>{children}</>;
  }

  return <Bridge>{children}</Bridge>;
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
            <SSRSafeJanuaAuthBridge>
              <AuthProvider>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <PreferencesProvider>{children as any}</PreferencesProvider>
              </AuthProvider>
            </SSRSafeJanuaAuthBridge>
            <CookieConsentBanner />
          </PostHogProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
