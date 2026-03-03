'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@dhanam/shared';
import { ThemeProvider } from '~/components/theme-provider';
import { AuthProvider } from '~/components/auth-provider';
import { PreferencesProvider } from '~/contexts/PreferencesContext';
import PostHogProvider from '~/providers/PostHogProvider';
import { JanuaAuthBridge } from '~/providers/JanuaAuthBridge';
import { useState } from 'react';
import { CookieConsentBanner } from '~/components/cookie-consent-banner';

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
            <JanuaAuthBridge>
              <AuthProvider>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <PreferencesProvider>{children as any}</PreferencesProvider>
              </AuthProvider>
            </JanuaAuthBridge>
            <CookieConsentBanner />
          </PostHogProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
