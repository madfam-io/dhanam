'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '~/components/theme-provider';
import { AuthProvider } from '~/components/auth-provider';
import { PreferencesProvider } from '~/contexts/PreferencesContext';
import PostHogProvider from '~/providers/PostHogProvider';
import { JanuaAuthBridge } from '~/providers/JanuaAuthBridge';
import { useState } from 'react';

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
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <PostHogProvider>
          <JanuaAuthBridge>
            <AuthProvider>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <PreferencesProvider>{children as any}</PreferencesProvider>
            </AuthProvider>
          </JanuaAuthBridge>
        </PostHogProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
