import {
  LoginDto,
  RegisterDto,
  AuthResponse,
  ChangePasswordDto,
  TwoFactorSetupResponse,
  VerifyTwoFactorDto,
} from '@dhanam/shared';

import { apiClient } from './client';

const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE || 'local';
const JANUA_URL = process.env.NEXT_PUBLIC_JANUA_API_URL || 'https://auth.madfam.io';

export function isJanuaAuthMode(): boolean {
  return AUTH_MODE === 'janua';
}

export function getJanuaUrl(): string {
  return JANUA_URL;
}

export const authApi = {
  async register(data: RegisterDto): Promise<AuthResponse> {
    if (isJanuaAuthMode()) {
      window.location.href = `${JANUA_URL}/register`;
      // Never resolves — browser navigates away
      return new Promise(() => {});
    }
    return apiClient.post<AuthResponse>('/auth/register', data);
  },

  async login(data: LoginDto): Promise<AuthResponse> {
    if (isJanuaAuthMode()) {
      window.location.href = `${JANUA_URL}/login`;
      return new Promise(() => {});
    }
    return apiClient.post<AuthResponse>('/auth/login', data);
  },

  async loginAsGuest(options?: { countryCode?: string }): Promise<{
    tokens: AuthResponse['tokens'];
    user: AuthResponse['user'];
    message: string;
  }> {
    return apiClient.post('/auth/guest', { countryCode: options?.countryCode });
  },

  async logout(refreshToken: string): Promise<void> {
    if (isJanuaAuthMode()) {
      window.location.href = `${JANUA_URL}/logout`;
      return;
    }
    return apiClient.post('/auth/logout', { refreshToken });
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
  },

  async changePassword(data: ChangePasswordDto): Promise<void> {
    if (isJanuaAuthMode()) {
      window.location.href = `${JANUA_URL}/account/security`;
      return;
    }
    return apiClient.post('/auth/password', data);
  },

  async setupTwoFactor(): Promise<TwoFactorSetupResponse> {
    return apiClient.post<TwoFactorSetupResponse>('/auth/2fa/setup');
  },

  async verifyTwoFactor(data: VerifyTwoFactorDto): Promise<void> {
    return apiClient.post('/auth/2fa/verify', data);
  },

  async loginAsPersona(
    persona: string,
    countryCode?: string
  ): Promise<{
    tokens: AuthResponse['tokens'];
    user: AuthResponse['user'] & { isDemo: boolean; persona: string };
    persona: string;
    message: string;
  }> {
    return apiClient.post('/auth/demo/login', { persona, countryCode });
  },

  async switchPersona(persona: string): Promise<{
    tokens: AuthResponse['tokens'];
    user: AuthResponse['user'] & { isDemo: boolean; persona: string };
    persona: string;
    message: string;
  }> {
    return apiClient.post('/auth/demo/switch', { persona });
  },

  async getPersonas(): Promise<{
    personas: Array<{
      key: string;
      email: string;
      name: string;
      archetype: string;
      features: string[];
      emoji: string;
    }>;
  }> {
    return apiClient.get('/auth/demo/personas');
  },
};
