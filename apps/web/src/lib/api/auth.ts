import { apiClient } from './client';
import {
  LoginDto,
  RegisterDto,
  AuthResponse,
  ChangePasswordDto,
  TwoFactorSetupResponse,
  VerifyTwoFactorDto,
} from '@dhanam/shared';

export const authApi = {
  async register(data: RegisterDto): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/register', data);
  },

  async login(data: LoginDto): Promise<AuthResponse> {
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
    return apiClient.post('/auth/logout', { refreshToken });
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
  },

  async changePassword(data: ChangePasswordDto): Promise<void> {
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
