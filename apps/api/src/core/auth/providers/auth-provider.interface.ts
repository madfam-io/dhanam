import {
  AuthTokens,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from '@dhanam/shared';

import { TotpSetupResponse } from '../totp.service';

// ─────────────────────────────────────────────────────────────────────────────
// Auth Provider Interface
// ─────────────────────────────────────────────────────────────────────────────
// Both LocalAuthProvider and JanuaAuthProvider implement this interface.
// The controller injects AUTH_PROVIDER and delegates without knowing which
// mode is active.
// ─────────────────────────────────────────────────────────────────────────────

export const AUTH_PROVIDER = Symbol('AUTH_PROVIDER');
export const MFA_PROVIDER = Symbol('MFA_PROVIDER');

export type AuthMode = 'local' | 'janua';

export interface AuthProvider {
  register(dto: RegisterDto): Promise<AuthTokens>;
  login(dto: LoginDto): Promise<AuthTokens>;
  refreshTokens(refreshToken: string): Promise<AuthTokens>;
  logout(refreshToken: string): Promise<void>;
  forgotPassword(dto: ForgotPasswordDto): Promise<void>;
  resetPassword(dto: ResetPasswordDto): Promise<void>;
}

export interface MfaProvider {
  setupTotp(userId: string, email: string): Promise<TotpSetupResponse>;
  enableTotp(userId: string, code: string): Promise<void>;
  disableTotp(userId: string, code: string): Promise<void>;
  verifyToken(secret: string, code: string): boolean;
  verifyEncryptedToken(encryptedSecret: string, code: string): boolean;
  generateBackupCodes(): string[];
  storeBackupCodes(userId: string, codes: string[]): Promise<void>;
  verifyBackupCode(userId: string, code: string): Promise<boolean>;
}
