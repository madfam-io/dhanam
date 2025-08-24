'use client';

import { useEffect } from 'react';
import { useAuth } from '~/lib/hooks/use-auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { tokens, refreshTokens, clearAuth } = useAuth();

  useEffect(() => {
    if (!tokens?.accessToken) return;

    // Parse JWT to get expiry time
    try {
      const tokenParts = tokens.accessToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = JSON.parse(atob(tokenParts[1]!));
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
            console.error('Auto token refresh failed:', error);
            clearAuth();
          }
        }, refreshTime);

        return () => clearTimeout(refreshTimer);
      } else {
        // Token already expired or expires very soon, try to refresh immediately
        refreshTokens().catch(() => {
          clearAuth();
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
