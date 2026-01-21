import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthTokens, UserProfile } from '@dhanam/shared';
import { apiClient } from '../api/client';
import { authApi } from '../api/auth';

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
        const { tokens } = get();
        if (!tokens?.accessToken) {
          return;
        }

        try {
          // This would typically be an API call to get the current user
          // For now, we'll just refresh the tokens which includes user data
          await get().refreshTokens();
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
        if (state?.tokens) {
          apiClient.setTokens(state.tokens);
        }
        // Mark hydration as complete
        useAuth.getState().setHasHydrated(true);
      },
    }
  )
);
