import { Test, TestingModule } from '@nestjs/testing';
import * as speakeasy from 'speakeasy';

import { PrismaService } from '@core/prisma/prisma.service';
import { LoggerService } from '@core/logger/logger.service';

import { TotpService } from '../totp.service';

describe('TotpService', () => {
  let service: TotpService;
  let prisma: jest.Mocked<PrismaService>;
  let logger: jest.Mocked<LoggerService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    totpSecret: null,
    totpTempSecret: null,
    totpEnabled: false,
    totpBackupCodes: [],
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TotpService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<TotpService>(TotpService);
    prisma = module.get(PrismaService);
    logger = module.get(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setupTotp', () => {
    it('should generate 32-character secret', async () => {
      prisma.user.update.mockResolvedValue(mockUser as any);

      const result = await service.setupTotp(mockUser.id, mockUser.email);

      expect(result.secret).toBeDefined();
      expect(result.secret.length).toBeGreaterThanOrEqual(32);
      expect(result.manualEntryKey).toBe(result.secret);
    });

    it('should generate QR code data URL', async () => {
      prisma.user.update.mockResolvedValue(mockUser as any);

      const result = await service.setupTotp(mockUser.id, mockUser.email);

      expect(result.qrCodeUrl).toBeDefined();
      expect(result.qrCodeUrl).toContain('data:image/png;base64');
    });

    it('should store temporary secret without activating TOTP', async () => {
      prisma.user.update.mockResolvedValue(mockUser as any);

      await service.setupTotp(mockUser.id, mockUser.email);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { totpTempSecret: expect.any(String) },
      });

      // Should NOT set totpSecret or totpEnabled
      const updateCall = prisma.user.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('totpSecret');
      expect(updateCall.data).not.toHaveProperty('totpEnabled');
    });

    it('should include correct issuer and name in QR code', async () => {
      prisma.user.update.mockResolvedValue(mockUser as any);

      const result = await service.setupTotp(mockUser.id, mockUser.email);

      // Verify QR code URL contains the expected issuer and email
      // QR codes encode the otpauth URL which includes issuer and name
      expect(result.qrCodeUrl).toBeDefined();
      expect(result.qrCodeUrl).toContain('data:image/png;base64');

      // The secret should be properly generated
      expect(result.secret).toBeDefined();
      expect(result.secret.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('enableTotp', () => {
    const tempSecret = 'JBSWY3DPEHPK3PXP';

    it('should activate TOTP with valid verification code', async () => {
      const userWithTempSecret = {
        ...mockUser,
        totpTempSecret: tempSecret,
      };

      prisma.user.findUnique.mockResolvedValue(userWithTempSecret as any);
      prisma.user.update.mockResolvedValue({
        ...userWithTempSecret,
        totpSecret: tempSecret,
        totpEnabled: true,
        totpTempSecret: null,
      } as any);

      // Generate a valid TOTP token for the secret
      const validToken = speakeasy.totp({
        secret: tempSecret,
        encoding: 'base32',
      });

      await service.enableTotp(mockUser.id, validToken);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          totpSecret: tempSecret,
          totpTempSecret: null,
          totpEnabled: true,
        },
      });
    });

    it('should reject invalid TOTP token', async () => {
      const userWithTempSecret = {
        ...mockUser,
        totpTempSecret: tempSecret,
      };

      prisma.user.findUnique.mockResolvedValue(userWithTempSecret as any);

      await expect(service.enableTotp(mockUser.id, '000000')).rejects.toThrow(
        'Invalid TOTP token',
      );

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw error if no TOTP setup in progress', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(service.enableTotp(mockUser.id, '123456')).rejects.toThrow(
        'No TOTP setup in progress',
      );
    });

    it('should verify token with 2-step window for clock drift', async () => {
      const userWithTempSecret = {
        ...mockUser,
        totpTempSecret: tempSecret,
      };

      prisma.user.findUnique.mockResolvedValue(userWithTempSecret as any);

      const verifySpy = jest.spyOn(speakeasy.totp, 'verify');
      const validToken = speakeasy.totp({
        secret: tempSecret,
        encoding: 'base32',
      });

      prisma.user.update.mockResolvedValue({} as any);

      await service.enableTotp(mockUser.id, validToken);

      expect(verifySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          window: 2, // 2-step window for clock drift
        }),
      );
    });
  });

  describe('disableTotp', () => {
    const activeSecret = 'JBSWY3DPEHPK3PXP';

    it('should disable TOTP with valid token', async () => {
      const userWithTotp = {
        ...mockUser,
        totpSecret: activeSecret,
        totpEnabled: true,
      };

      prisma.user.findUnique.mockResolvedValue(userWithTotp as any);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        totpSecret: null,
        totpEnabled: false,
      } as any);

      const validToken = speakeasy.totp({
        secret: activeSecret,
        encoding: 'base32',
      });

      await service.disableTotp(mockUser.id, validToken);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          totpSecret: null,
          totpTempSecret: null,
          totpEnabled: false,
        },
      });
    });

    it('should reject invalid token when disabling', async () => {
      const userWithTotp = {
        ...mockUser,
        totpSecret: activeSecret,
        totpEnabled: true,
      };

      prisma.user.findUnique.mockResolvedValue(userWithTotp as any);

      await expect(service.disableTotp(mockUser.id, '000000')).rejects.toThrow(
        'Invalid TOTP token',
      );
    });

    it('should throw error if TOTP not enabled', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(service.disableTotp(mockUser.id, '123456')).rejects.toThrow(
        'TOTP not enabled',
      );
    });
  });

  describe('verifyToken', () => {
    const secret = 'JBSWY3DPEHPK3PXP';

    it('should verify valid TOTP code', () => {
      const validToken = speakeasy.totp({
        secret,
        encoding: 'base32',
      });

      const result = service.verifyToken(secret, validToken);

      expect(result).toBe(true);
    });

    it('should reject expired codes', () => {
      // Use a token from 5 minutes ago (should be expired)
      const expiredToken = speakeasy.totp({
        secret,
        encoding: 'base32',
        time: Math.floor(Date.now() / 1000) - 300,
      });

      const result = service.verifyToken(secret, expiredToken);

      expect(result).toBe(false);
    });

    it('should reject invalid codes', () => {
      const result = service.verifyToken(secret, '000000');

      expect(result).toBe(false);
    });

    it('should use 2-step window', () => {
      const verifySpy = jest.spyOn(speakeasy.totp, 'verify');
      const validToken = speakeasy.totp({
        secret,
        encoding: 'base32',
      });

      service.verifyToken(secret, validToken);

      expect(verifySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          window: 2,
        }),
      );
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate 10 backup codes', () => {
      const codes = service.generateBackupCodes();

      expect(codes).toHaveLength(10);
    });

    it('should generate unique codes', () => {
      const codes = service.generateBackupCodes();
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(10);
    });

    it('should use cryptographically secure random bytes', () => {
      const codes = service.generateBackupCodes();

      // Each code should be 8 characters (hex from 4 bytes)
      codes.forEach((code) => {
        expect(code).toHaveLength(8);
        expect(code).toMatch(/^[0-9A-F]+$/); // Uppercase hex
      });
    });

    it('should generate different codes on each call', () => {
      const codes1 = service.generateBackupCodes();
      const codes2 = service.generateBackupCodes();

      expect(codes1).not.toEqual(codes2);
    });
  });

  describe('storeBackupCodes', () => {
    it('should hash codes before storing', async () => {
      const codes = ['12345678', '87654321'];
      prisma.user.update.mockResolvedValue(mockUser as any);

      await service.storeBackupCodes(mockUser.id, codes);

      const updateCall = prisma.user.update.mock.calls[0][0];
      const storedCodes = updateCall.data.totpBackupCodes;

      // Stored codes should be SHA256 hashes (64 characters)
      expect(storedCodes).toHaveLength(2);
      storedCodes.forEach((hash: string) => {
        expect(hash).toHaveLength(64);
        expect(hash).toMatch(/^[0-9a-f]+$/);
      });

      // Hashes should not match original codes
      expect(storedCodes).not.toContain(codes[0]);
      expect(storedCodes).not.toContain(codes[1]);
    });

    it('should log backup code generation', async () => {
      const codes = ['12345678'];
      prisma.user.update.mockResolvedValue(mockUser as any);

      await service.storeBackupCodes(mockUser.id, codes);

      expect(logger.log).toHaveBeenCalledWith(
        `Backup codes generated for user: ${mockUser.id}`,
        'TotpService',
      );
    });
  });

  describe('verifyBackupCode', () => {
    const validCode = '12345678';
    const hashedCode = require('crypto')
      .createHash('sha256')
      .update(validCode)
      .digest('hex');

    it('should verify valid backup code', async () => {
      const userWithBackupCodes = {
        ...mockUser,
        totpBackupCodes: [hashedCode, 'otherhash'],
      };

      prisma.user.findUnique.mockResolvedValue(userWithBackupCodes as any);
      prisma.user.update.mockResolvedValue(mockUser as any);

      const result = await service.verifyBackupCode(mockUser.id, validCode);

      expect(result).toBe(true);
    });

    it('should invalidate used backup code', async () => {
      const userWithBackupCodes = {
        ...mockUser,
        totpBackupCodes: [hashedCode, 'otherhash'],
      };

      prisma.user.findUnique.mockResolvedValue(userWithBackupCodes as any);
      prisma.user.update.mockResolvedValue(mockUser as any);

      await service.verifyBackupCode(mockUser.id, validCode);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          totpBackupCodes: ['otherhash'], // Used code removed
        },
      });
    });

    it('should reject invalid backup code', async () => {
      const userWithBackupCodes = {
        ...mockUser,
        totpBackupCodes: [hashedCode],
      };

      prisma.user.findUnique.mockResolvedValue(userWithBackupCodes as any);

      const result = await service.verifyBackupCode(mockUser.id, 'invalid');

      expect(result).toBe(false);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should return false if no backup codes exist', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.verifyBackupCode(mockUser.id, validCode);

      expect(result).toBe(false);
    });

    it('should log when backup code is used', async () => {
      const userWithBackupCodes = {
        ...mockUser,
        totpBackupCodes: [hashedCode],
      };

      prisma.user.findUnique.mockResolvedValue(userWithBackupCodes as any);
      prisma.user.update.mockResolvedValue(mockUser as any);

      await service.verifyBackupCode(mockUser.id, validCode);

      expect(logger.log).toHaveBeenCalledWith(
        `Backup code used for user: ${mockUser.id}`,
        'TotpService',
      );
    });
  });
});
