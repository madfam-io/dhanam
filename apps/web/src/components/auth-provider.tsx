'use client';

import { useEffect } from 'react';
import { useAuth } from '~/lib/hooks/use-auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { tokens, isAuthenticated, setAuth, refreshTokens, clearAuth } = useAuth();

  // Bootstrap: if Janua tokens exist in localStorage but Zustand store is empty,
  // hydrate the store directly. This handles the case where JanuaAuthSync hasn't
  // fired (SDK init delay, getCurrentUser failure, etc.)
  useEffect(() => {
    if (isAuthenticated) return; // Already authenticated

    const januaToken = localStorage.getItem('janua_access_token');
    if (!januaToken) return;

    try {
      const parts = januaToken.split('.');
      if (parts.length !== 3 || !parts[1]) return;

      const payload = JSON.parse(atob(parts[1]));
      if (!payload.sub || !payload.exp) return;

      // Check token isn't expired
      if (payload.exp * 1000 < Date.now()) return;

      setAuth(
        {
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
        },
        {
          accessToken: januaToken,
          refreshToken: localStorage.getItem('janua_refresh_token') || '',
          expiresIn: payload.exp - Math.floor(Date.now() / 1000),
        }
      );

      // Set middleware cookie
      document.cookie = 'auth-storage=authenticated; path=/; max-age=86400; SameSite=Lax; Secure';
    } catch {
      // Token parse failed — ignore
    }
  }, [isAuthenticated, setAuth]);

  useEffect(() => {
    if (!tokens?.accessToken) return;

    // Parse JWT to get expiry time
    try {
      const tokenParts = tokens.accessToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payloadPart = tokenParts[1];
      if (!payloadPart) {
        throw new Error('Invalid JWT: missing payload');
      }
      const payload = JSON.parse(atob(payloadPart));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;

      // Refresh token 2 minutes before expiry (tokens expire in 15 minutes)
      const refreshTime = Math.max(timeUntilExpiry - 2 * 60 * 1000, 30 * 1000); // At least 30s

      if (refreshTime > 0) {
        const refreshTimer = setTimeout(async () => {
          try {
            await refreshTokens();
          } catch (error) {
            // Don't immediately clear auth — the access token might still be valid
            // Let JanuaAuthSync or the next API call handle re-authentication
            console.warn('Auto token refresh failed, will retry on next API call:', error);
          }
        }, refreshTime);

        return () => clearTimeout(refreshTimer);
      } else {
        // Token already expired or expires very soon, try to refresh immediately
        refreshTokens().catch(() => {
          // Don't clear auth here — let JanuaAuthSync or the next API call handle it
          console.warn('Token refresh failed, will retry on next API call');
        });
        return;
      }
    } catch (error) {
      console.error('Failed to parse JWT token:', error);
      clearAuth();
      return;
    }
  }, [tokens?.accessToken, refreshTokens, clearAuth]);

  return <>{children}</>;
}
