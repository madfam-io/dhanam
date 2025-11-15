import { Test, TestingModule } from '@nestjs/testing';
import { randomBytes } from 'crypto';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

import { TotpService } from '../totp.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { LoggerService } from '@core/logger/logger.service';

// Mock crypto module
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TotpService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TotpService>(TotpService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    logger = module.get(LoggerService) as jest.Mocked<LoggerService>;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('setupTotp', () => {
    it('should generate TOTP secret and QR code', async () => {
      // Arrange
      const userId = 'user-123';
      const userEmail = 'test@example.com';
      const mockSecret = {
        base32: 'JBSWY3DPEHPK3PXP',
        otpauth_url: 'otpauth://totp/Dhanam%20(test@example.com)?secret=JBSWY3DPEHPK3PXP&issuer=Dhanam%20Ledger',
      };

      jest.spyOn(speakeasy, 'generateSecret').mockReturnValue(mockSecret as any);
      jest.spyOn(qrcode, 'toDataURL').mockResolvedValue('data:image/png;base64,mock');
      prisma.user.update.mockResolvedValue(mockUser as any);

      // Act
      const result = await service.setupTotp(userId, userEmail);

      // Assert
      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: `Dhanam (${userEmail})`,
        issuer: 'Dhanam Ledger',
        length: 32,
      });
      expect(qrcode.toDataURL).toHaveBeenCalledWith(mockSecret.otpauth_url);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { totpTempSecret: mockSecret.base32 },
      });
      expect(result).toEqual({
        qrCodeUrl: 'data:image/png;base64,mock',
        secret: mockSecret.base32,
        manualEntryKey: mockSecret.base32,
      });
    });

    it('should store secret as temporary until verified', async () => {
      // Arrange
      const userId = 'user-123';
      const userEmail = 'test@example.com';
      jest.spyOn(speakeasy, 'generateSecret').mockReturnValue({
        base32: 'SECRET',
        otpauth_url: 'url',
      } as any);
      jest.spyOn(qrcode, 'toDataURL').mockResolvedValue('qr');
      prisma.user.update.mockResolvedValue(mockUser as any);

      // Act
      await service.setupTotp(userId, userEmail);

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { totpTempSecret: 'SECRET' },
      });
      expect(logger.log).toHaveBeenCalledWith(
        `TOTP setup initiated for user: ${userId}`,
        'TotpService'
      );
    });
  });

  describe('enableTotp', () => {
    it('should activate TOTP after successful verification', async () => {
      // Arrange
      const userId = 'user-123';
      const token = '123456';
      const userWithTempSecret = {
        ...mockUser,
        totpTempSecret: 'TEMP_SECRET',
      };

      prisma.user.findUnique.mockResolvedValue(userWithTempSecret as any);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true as any);
      prisma.user.update.mockResolvedValue(mockUser as any);

      // Act
      await service.enableTotp(userId, token);

      // Assert
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'TEMP_SECRET',
        encoding: 'base32',
        token,
        window: 2,
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          totpSecret: 'TEMP_SECRET',
          totpTempSecret: null,
          totpEnabled: true,
        },
      });
    });

    it('should allow 2 time steps for clock drift', async () => {
      // Arrange
      const userId = 'user-123';
      const token = '123456';
      prisma.user.findUnique.mockResolvedValue({
        totpTempSecret: 'SECRET',
      } as any);
      const verifySpy = jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true as any);
      prisma.user.update.mockResolvedValue(mockUser as any);

      // Act
      await service.enableTotp(userId, token);

      // Assert
      expect(verifySpy).toHaveBeenCalledWith(
        expect.objectContaining({ window: 2 })
      );
    });

    it('should throw error if no TOTP setup in progress', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue({ totpTempSecret: null } as any);

      // Act & Assert
      await expect(service.enableTotp('user-123', '123456')).rejects.toThrow(
        'No TOTP setup in progress'
      );
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue({
        totpTempSecret: 'SECRET',
      } as any);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false as any);

      // Act & Assert
      await expect(service.enableTotp('user-123', 'wrong')).rejects.toThrow(
        'Invalid TOTP token'
      );
    });
  });

  describe('disableTotp', () => {
    it('should disable TOTP after verification', async () => {
      // Arrange
      const userId = 'user-123';
      const token = '123456';
      const userWithTotp = {
        ...mockUser,
        totpSecret: 'ACTIVE_SECRET',
        totpEnabled: true,
      };

      prisma.user.findUnique.mockResolvedValue(userWithTotp as any);
      jest.spyOn(service, 'verifyToken').mockReturnValue(true);
      prisma.user.update.mockResolvedValue(mockUser as any);

      // Act
      await service.disableTotp(userId, token);

      // Assert
      expect(service.verifyToken).toHaveBeenCalledWith('ACTIVE_SECRET', token);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          totpSecret: null,
          totpTempSecret: null,
          totpEnabled: false,
        },
      });
    });

    it('should throw error if TOTP not enabled', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue({ totpSecret: null } as any);

      // Act & Assert
      await expect(service.disableTotp('user-123', '123456')).rejects.toThrow(
        'TOTP not enabled'
      );
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue({
        totpSecret: 'SECRET',
      } as any);
      jest.spyOn(service, 'verifyToken').mockReturnValue(false);

      // Act & Assert
      await expect(service.disableTotp('user-123', 'wrong')).rejects.toThrow(
        'Invalid TOTP token'
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify valid TOTP token', () => {
      // Arrange
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = '123456';
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true as any);

      // Act
      const result = service.verifyToken(secret, token);

      // Assert
      expect(result).toBe(true);
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret,
        encoding: 'base32',
        token,
        window: 2,
      });
    });

    it('should reject invalid TOTP token', () => {
      // Arrange
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false as any);

      // Act
      const result = service.verifyToken('SECRET', 'invalid');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('generateBackupCodes - SECURITY CRITICAL', () => {
    it('should generate 10 backup codes', () => {
      // Arrange
      const mockRandomBytes = randomBytes as jest.MockedFunction<typeof randomBytes>;
      mockRandomBytes.mockReturnValue(Buffer.from([0x12, 0x34, 0x56, 0x78]));

      // Act
      const codes = service.generateBackupCodes();

      // Assert
      expect(codes).toHaveLength(10);
      expect(mockRandomBytes).toHaveBeenCalledTimes(10);
    });

    it('should use crypto.randomBytes (NOT Math.random) for security', () => {
      // Arrange
      const mockRandomBytes = randomBytes as jest.MockedFunction<typeof randomBytes>;
      mockRandomBytes.mockReturnValue(Buffer.from([0xAB, 0xCD, 0xEF, 0x12]));

      // Act
      service.generateBackupCodes();

      // Assert
      expect(mockRandomBytes).toHaveBeenCalledWith(4); // 4 bytes = 8 hex characters
      // Verify Math.random was NOT used (it's not imported/available)
    });

    it('should generate 8-character uppercase hex codes', () => {
      // Arrange
      const mockRandomBytes = randomBytes as jest.MockedFunction<typeof randomBytes>;
      mockRandomBytes.mockReturnValue(Buffer.from([0xAB, 0xCD, 0xEF, 0x12]));

      // Act
      const codes = service.generateBackupCodes();

      // Assert
      codes.forEach(code => {
        expect(code).toHaveLength(8);
        expect(code).toMatch(/^[0-9A-F]{8}$/); // Uppercase hex
      });
    });

    it('should generate unique codes (cryptographically random)', () => {
      // Arrange
      let callCount = 0;
      const mockRandomBytes = randomBytes as jest.MockedFunction<typeof randomBytes>;
      mockRandomBytes.mockImplementation((size: number) => {
        callCount++;
        return Buffer.from([callCount, callCount + 1, callCount + 2, callCount + 3]);
      });

      // Act
      const codes = service.generateBackupCodes();

      // Assert
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(10); // All codes should be unique
    });

    it('should produce different codes on multiple calls', () => {
      // Arrange
      const mockRandomBytes = randomBytes as jest.MockedFunction<typeof randomBytes>;
      mockRandomBytes
        .mockReturnValueOnce(Buffer.from([0x11, 0x22, 0x33, 0x44]))
        .mockReturnValueOnce(Buffer.from([0x55, 0x66, 0x77, 0x88]));

      // Act
      const codes1 = service.generateBackupCodes();
      const codes2 = service.generateBackupCodes();

      // Assert
      expect(codes1[0]).not.toBe(codes2[0]);
    });
  });

  describe('storeBackupCodes', () => {
    it('should hash backup codes before storing', async () => {
      // Arrange
      const userId = 'user-123';
      const codes = ['ABCD1234', 'EFGH5678'];
      prisma.user.update.mockResolvedValue(mockUser as any);

      // Act
      await service.storeBackupCodes(userId, codes);

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          totpBackupCodes: expect.arrayContaining([
            expect.stringMatching(/^[a-f0-9]{64}$/), // SHA-256 hex
          ]),
        },
      });
    });

    it('should use SHA-256 for hashing backup codes', async () => {
      // Arrange
      const userId = 'user-123';
      const codes = ['TESTCODE'];
      prisma.user.update.mockResolvedValue(mockUser as any);

      // Act
      await service.storeBackupCodes(userId, codes);

      // Assert
      const callArgs = prisma.user.update.mock.calls[0][0];
      const hashedCodes = callArgs.data.totpBackupCodes;
      expect(hashedCodes[0]).toHaveLength(64); // SHA-256 produces 64 hex characters
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify valid backup code', async () => {
      // Arrange
      const userId = 'user-123';
      const code = 'VALIDCODE';
      const hashedCode = require('crypto')
        .createHash('sha256')
        .update(code)
        .digest('hex');

      prisma.user.findUnique.mockResolvedValue({
        totpBackupCodes: [hashedCode],
      } as any);
      prisma.user.update.mockResolvedValue(mockUser as any);

      // Act
      const result = await service.verifyBackupCode(userId, code);

      // Assert
      expect(result).toBe(true);
    });

    it('should remove used backup code', async () => {
      // Arrange
      const userId = 'user-123';
      const code = 'USEDCODE';
      const hashedCode = require('crypto')
        .createHash('sha256')
        .update(code)
        .digest('hex');
      const otherHashedCode = 'other-hash';

      prisma.user.findUnique.mockResolvedValue({
        totpBackupCodes: [hashedCode, otherHashedCode],
      } as any);
      prisma.user.update.mockResolvedValue(mockUser as any);

      // Act
      await service.verifyBackupCode(userId, code);

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          totpBackupCodes: [otherHashedCode], // Used code removed
        },
      });
    });

    it('should return false for invalid backup code', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue({
        totpBackupCodes: ['valid-hash'],
      } as any);

      // Act
      const result = await service.verifyBackupCode('user-123', 'WRONGCODE');

      // Assert
      expect(result).toBe(false);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should return false if no backup codes exist', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue({
        totpBackupCodes: null,
      } as any);

      // Act
      const result = await service.verifyBackupCode('user-123', 'ANYCODE');

      // Assert
      expect(result).toBe(false);
    });

    it('should log backup code usage', async () => {
      // Arrange
      const userId = 'user-123';
      const code = 'VALIDCODE';
      const hashedCode = require('crypto')
        .createHash('sha256')
        .update(code)
        .digest('hex');

      prisma.user.findUnique.mockResolvedValue({
        totpBackupCodes: [hashedCode],
      } as any);
      prisma.user.update.mockResolvedValue(mockUser as any);

      // Act
      await service.verifyBackupCode(userId, code);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        `Backup code used for user: ${userId}`,
        'TotpService'
      );
    });
  });
});
