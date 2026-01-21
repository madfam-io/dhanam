'use client';

/**
 * Local stub for @janua/react-sdk
 *
 * This provides a minimal implementation for dogfooding while the real
 * @janua/react-sdk package is being developed. Replace with the real
 * package once published to npm.madfam.io.
 *
 * @temporary - Remove when @janua/react-sdk is published
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// Types matching what the real SDK will provide
export interface JanuaUser {
  id: string;
  email: string;
  name?: string;
  display_name?: string;
  locale?: string;
  timezone?: string;
  mfa_enabled?: boolean;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface JanuaConfig {
  baseURL: string;
  apiKey: string;
  environment: 'development' | 'production';
  debug: boolean;
}

interface JanuaContextValue {
  user: JanuaUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const JanuaContext = createContext<JanuaContextValue | null>(null);

const STORAGE_KEYS = {
  accessToken: 'janua_access_token',
  refreshToken: 'janua_refresh_token',
  user: 'janua_user',
} as const;

export function JanuaProvider({ config, children }: { config: JanuaConfig; children: ReactNode }) {
  const [user, setUser] = useState<JanuaUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const baseURL = config.baseURL;

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.user);
        const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);

        // If we have an access token, validate it and fetch/update user
        // This handles both cases: cached user exists OR SSO callback just stored token
        if (accessToken) {
          // Validate token with Janua and get fresh user data
          const response = await fetch(`${baseURL}/api/v1/auth/me`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            const userData = data.user || data;
            // Update user state and cache
            setUser(userData);
            localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData));
          } else {
            // Token invalid, clear storage
            localStorage.removeItem(STORAGE_KEYS.accessToken);
            localStorage.removeItem(STORAGE_KEYS.refreshToken);
            localStorage.removeItem(STORAGE_KEYS.user);
          }
        } else if (storedUser) {
          // No access token but have cached user - clear stale cache
          localStorage.removeItem(STORAGE_KEYS.user);
        }
      } catch (error) {
        if (config.debug) {
          console.warn('[JanuaSDK] Session check failed:', error);
        }
        // On network error, use cached user if available (offline support)
        const storedUser = localStorage.getItem(STORAGE_KEYS.user);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem(STORAGE_KEYS.user);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [baseURL, config.debug]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(`${baseURL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Login failed');
        }

        const data = await response.json();

        localStorage.setItem(STORAGE_KEYS.accessToken, data.access_token);
        localStorage.setItem(STORAGE_KEYS.refreshToken, data.refresh_token);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));

        setUser(data.user);
      } finally {
        setIsLoading(false);
      }
    },
    [baseURL]
  );

  const logout = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
      if (accessToken) {
        await fetch(`${baseURL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    } catch (error) {
      if (config.debug) {
        console.warn('[JanuaSDK] Logout request failed:', error);
      }
    } finally {
      localStorage.removeItem(STORAGE_KEYS.accessToken);
      localStorage.removeItem(STORAGE_KEYS.refreshToken);
      localStorage.removeItem(STORAGE_KEYS.user);
      setUser(null);
    }
  }, [baseURL, config.debug]);

  const refreshSession = useCallback(async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
    if (!refreshToken) return;

    try {
      const response = await fetch(`${baseURL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(STORAGE_KEYS.accessToken, data.access_token);
        if (data.refresh_token) {
          localStorage.setItem(STORAGE_KEYS.refreshToken, data.refresh_token);
        }
      }
    } catch (error) {
      if (config.debug) {
        console.warn('[JanuaSDK] Token refresh failed:', error);
      }
    }
  }, [baseURL, config.debug]);

  const value: JanuaContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshSession,
  };

  return <JanuaContext.Provider value={value}>{children}</JanuaContext.Provider>;
}

export function useJanua(): JanuaContextValue {
  const context = useContext(JanuaContext);
  if (!context) {
    throw new Error('useJanua must be used within a JanuaProvider');
  }
  return context;
}
