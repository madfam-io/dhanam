import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { apiClient } from '../api/client';

interface AdminAuthState {
  user: {
    id: string;
    email: string;
    name: string;
    spaces?: Array<{ id: string; role: string }>;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  _hasHydrated: boolean;

  setHasHydrated: (state: boolean) => void;
  logout: () => void;
}

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      logout: () => {
        apiClient.clearTokens();
        set({ user: null, token: null, isAuthenticated: false, isAdmin: false });
        if (typeof document !== 'undefined') {
          const isProduction = window.location.hostname.endsWith('.dhan.am');
          const domainAttr = isProduction ? ' Domain=.dhan.am;' : '';
          document.cookie = `auth-storage=; path=/;${domainAttr} max-age=0; SameSite=Lax`;
        }
        window.location.href = '/login';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        try {
          if (state?.token) {
            apiClient.setTokens({ accessToken: state.token });
            const isAdmin =
              state.user?.spaces?.some((s) => s.role === 'admin' || s.role === 'owner') ?? false;
            useAdminAuth.setState({ isAdmin });
          }
        } catch (error) {
          console.error('[useAdminAuth] Rehydration error:', error);
        } finally {
          useAdminAuth.getState().setHasHydrated(true);
        }
      },
    }
  )
);

if (typeof window !== 'undefined') {
  const scheduleHydrationCheck = () => {
    const state = useAdminAuth.getState();
    if (!state._hasHydrated) {
      state.setHasHydrated(true);
    }
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(scheduleHydrationCheck, { timeout: 1000 });
  } else {
    setTimeout(scheduleHydrationCheck, 500);
  }
}
