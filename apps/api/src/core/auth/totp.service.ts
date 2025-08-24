import { Injectable } from '@nestjs/common';
import * as qrcode from 'qrcode';
import * as speakeasy from 'speakeasy';

import { LoggerService } from '@core/logger/logger.service';
import { PrismaService } from '@core/prisma/prisma.service';

export interface TotpSetupResponse {
  qrCodeUrl: string;
  secret: string;
  manualEntryKey: string;
}

@Injectable()
export class TotpService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService
  ) {}

  async setupTotp(userId: string, userEmail: string): Promise<TotpSetupResponse> {
    const secret = speakeasy.generateSecret({
      name: `Dhanam (${userEmail})`,
      issuer: 'Dhanam Ledger',
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    // Store temporary secret (not activated until verified)
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpTempSecret: secret.base32 },
    });

    this.logger.log(`TOTP setup initiated for user: ${userId}`, 'TotpService');

    return {
      qrCodeUrl,
      secret: secret.base32!,
      manualEntryKey: secret.base32!,
    };
  }

  async enableTotp(userId: string, token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpTempSecret: true },
    });

    if (!user?.totpTempSecret) {
      throw new Error('No TOTP setup in progress');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.totpTempSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps for clock drift
    });

    if (!isValid) {
      throw new Error('Invalid TOTP token');
    }

    // Activate TOTP
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: user.totpTempSecret,
        totpTempSecret: null,
        totpEnabled: true,
      },
    });

    this.logger.log(`TOTP enabled for user: ${userId}`, 'TotpService');
  }

  async disableTotp(userId: string, token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true },
    });

    if (!user?.totpSecret) {
      throw new Error('TOTP not enabled');
    }

    const isValid = this.verifyToken(user.totpSecret, token);

    if (!isValid) {
      throw new Error('Invalid TOTP token');
    }

    // Disable TOTP
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: null,
        totpTempSecret: null,
        totpEnabled: false,
      },
    });

    this.logger.log(`TOTP disabled for user: ${userId}`, 'TotpService');
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps for clock drift
    });
  }

  generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-digit backup codes
      const code = Math.random().toString().slice(2, 10);
      codes.push(code);
    }
    return codes;
  }

  async storeBackupCodes(userId: string, codes: string[]): Promise<void> {
    // Hash backup codes before storing
    const hashedCodes = codes.map((code) =>
      require('crypto').createHash('sha256').update(code).digest('hex')
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpBackupCodes: hashedCodes },
    });

    this.logger.log(`Backup codes generated for user: ${userId}`, 'TotpService');
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpBackupCodes: true },
    });

    if (!user?.totpBackupCodes) {
      return false;
    }

    const hashedCode = require('crypto').createHash('sha256').update(code).digest('hex');
    const codeIndex = user.totpBackupCodes.indexOf(hashedCode);

    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    const updatedCodes = [...user.totpBackupCodes];
    updatedCodes.splice(codeIndex, 1);

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpBackupCodes: updatedCodes },
    });

    this.logger.log(`Backup code used for user: ${userId}`, 'TotpService');
    return true;
  }
}
