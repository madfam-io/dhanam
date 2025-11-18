import { User } from '@dhanam/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

import { apiClient } from '@/services/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

interface LoginCredentials {
  email: string;
  password: string;
  totpCode?: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  locale?: string;
  timezone?: string;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTH'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'CLEAR_AUTH' }
  | { type: 'SET_USER'; payload: User };

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_AUTH':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'CLEAR_AUTH':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_tokens';
const USER_KEY = 'user_data';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  useEffect(() => {
    if (state.accessToken) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, [state.accessToken]);

  const loadStoredAuth = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const tokenData = await SecureStore.getItemAsync(TOKEN_KEY);
      const userData = await AsyncStorage.getItem(USER_KEY);

      if (tokenData && userData) {
        const tokens = JSON.parse(tokenData);
        const user = JSON.parse(userData);

        dispatch({
          type: 'SET_AUTH',
          payload: {
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          },
        });

        // Verify token is still valid
        await verifyToken(tokens.accessToken);
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      await clearStoredAuth();
      dispatch({ type: 'CLEAR_AUTH' });
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch({ type: 'SET_USER', payload: response.data });
    } catch {
      // Token is invalid, try to refresh
      await refreshAuth();
    }
  };

  const storeAuth = async (user: User, accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify({ accessToken, refreshToken }));
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  const clearStoredAuth = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await apiClient.post('/auth/login', credentials);
      const { user, accessToken, refreshToken } = response.data;

      await storeAuth(user, accessToken, refreshToken);

      dispatch({
        type: 'SET_AUTH',
        payload: { user, accessToken, refreshToken },
      });
    } catch (error: unknown) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await apiClient.post('/auth/register', {
        ...data,
        locale: data.locale || 'en',
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      const { user, accessToken, refreshToken } = response.data;

      await storeAuth(user, accessToken, refreshToken);

      dispatch({
        type: 'SET_AUTH',
        payload: { user, accessToken, refreshToken },
      });
    } catch (error: unknown) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (state.refreshToken) {
        await apiClient.post('/auth/logout', {
          refreshToken: state.refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await clearStoredAuth();
      dispatch({ type: 'CLEAR_AUTH' });
      router.replace('/(auth)/welcome');
    }
  };

  const refreshAuth = async () => {
    try {
      if (!state.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post('/auth/refresh', {
        refreshToken: state.refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      await storeAuth(state.user!, accessToken, newRefreshToken);

      dispatch({
        type: 'SET_AUTH',
        payload: {
          user: state.user!,
          accessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
