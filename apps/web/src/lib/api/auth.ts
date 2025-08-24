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
};