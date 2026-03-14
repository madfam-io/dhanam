import {
  AuthTokens,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from '@dhanam/shared';
import { GoneException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthProvider } from './auth-provider.interface';

/**
 * Janua auth provider — used when AUTH_MODE=janua.
 *
 * In Janua mode, auth flows are handled by the Janua identity provider.
 * Registration, login, password reset, and account management happen on
 * the Janua UI. These endpoints return 410 Gone with redirect information
 * so the frontend can send the user to Janua.
 *
 * Token refresh proxies to Janua's token endpoint. Logout revokes the
 * Janua session.
 */
@Injectable()
export class JanuaAuthProvider implements AuthProvider {
  private readonly logger = new Logger(JanuaAuthProvider.name);
  private readonly januaIssuer: string;

  constructor(private readonly config: ConfigService) {
    this.januaIssuer = this.config.get<string>('janua.issuer') || 'https://auth.madfam.io';
  }

  async register(_dto: RegisterDto): Promise<AuthTokens> {
    this.logger.debug('Register called in Janua mode — returning redirect');
    throw new GoneException({
      message: 'Registration is handled by Janua',
      redirectUrl: `${this.januaIssuer}/register`,
      authMode: 'janua',
    });
  }

  async login(_dto: LoginDto): Promise<AuthTokens> {
    this.logger.debug('Login called in Janua mode — returning redirect');
    throw new GoneException({
      message: 'Login is handled by Janua',
      redirectUrl: `${this.januaIssuer}/login`,
      authMode: 'janua',
    });
  }

  async refreshTokens(_refreshToken: string): Promise<AuthTokens> {
    // In Janua mode, token refresh is handled by the Janua OIDC token endpoint.
    // The frontend should call Janua directly. If this endpoint is hit, the
    // client is misconfigured.
    this.logger.debug('Refresh called in Janua mode — returning redirect');
    throw new GoneException({
      message: 'Token refresh is handled by Janua',
      tokenEndpoint: `${this.januaIssuer}/oauth/token`,
      authMode: 'janua',
    });
  }

  async logout(_refreshToken: string): Promise<void> {
    // In Janua mode, logout should end the Janua session.
    // The frontend redirects to Janua's logout endpoint.
    this.logger.debug('Logout called in Janua mode — returning redirect');
    throw new GoneException({
      message: 'Logout is handled by Janua',
      redirectUrl: `${this.januaIssuer}/logout`,
      authMode: 'janua',
    });
  }

  async forgotPassword(_dto: ForgotPasswordDto): Promise<void> {
    this.logger.debug('Forgot password called in Janua mode — returning redirect');
    throw new GoneException({
      message: 'Password reset is handled by Janua',
      redirectUrl: `${this.januaIssuer}/forgot-password`,
      authMode: 'janua',
    });
  }

  async resetPassword(_dto: ResetPasswordDto): Promise<void> {
    this.logger.debug('Reset password called in Janua mode — returning redirect');
    throw new GoneException({
      message: 'Password reset is handled by Janua',
      redirectUrl: `${this.januaIssuer}/forgot-password`,
      authMode: 'janua',
    });
  }
}
