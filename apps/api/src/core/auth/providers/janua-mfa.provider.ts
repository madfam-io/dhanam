import { GoneException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TotpSetupResponse } from '../totp.service';

import { MfaProvider } from './auth-provider.interface';

/**
 * Janua MFA provider — used when AUTH_MODE=janua.
 *
 * In Janua mode, MFA management is handled by Janua's account settings.
 * Endpoints return 410 Gone with redirect information so the frontend
 * can link the user to Janua's MFA settings page.
 */
@Injectable()
export class JanuaMfaProvider implements MfaProvider {
  private readonly logger = new Logger(JanuaMfaProvider.name);
  private readonly januaIssuer: string;

  constructor(private readonly config: ConfigService) {
    this.januaIssuer = this.config.get<string>('janua.issuer') || 'https://auth.madfam.io';
  }

  private throwMfaRedirect(operation: string): never {
    this.logger.debug(`${operation} called in Janua mode — returning redirect`);
    throw new GoneException({
      message: 'MFA management is handled by Janua',
      redirectUrl: `${this.januaIssuer}/account/security`,
      authMode: 'janua',
    });
  }

  async setupTotp(_userId: string, _email: string): Promise<TotpSetupResponse> {
    this.throwMfaRedirect('setupTotp');
  }

  async enableTotp(_userId: string, _code: string): Promise<void> {
    this.throwMfaRedirect('enableTotp');
  }

  async disableTotp(_userId: string, _code: string): Promise<void> {
    this.throwMfaRedirect('disableTotp');
  }

  verifyToken(_secret: string, _code: string): boolean {
    this.throwMfaRedirect('verifyToken');
  }

  verifyEncryptedToken(_encryptedSecret: string, _code: string): boolean {
    this.throwMfaRedirect('verifyEncryptedToken');
  }

  generateBackupCodes(): string[] {
    this.throwMfaRedirect('generateBackupCodes');
  }

  async storeBackupCodes(_userId: string, _codes: string[]): Promise<void> {
    this.throwMfaRedirect('storeBackupCodes');
  }

  async verifyBackupCode(_userId: string, _code: string): Promise<boolean> {
    this.throwMfaRedirect('verifyBackupCode');
  }
}
