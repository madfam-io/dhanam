import { GoneException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { JanuaMfaProvider } from '../providers/janua-mfa.provider';

describe('JanuaMfaProvider', () => {
  let provider: JanuaMfaProvider;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('https://auth.madfam.io'),
    } as any;
    provider = new JanuaMfaProvider(configService);
  });

  describe('MFA endpoints return 410 Gone with redirect info', () => {
    it('setupTotp should throw GoneException with redirect URL', async () => {
      try {
        await provider.setupTotp('user-123', 'test@example.com');
        fail('Expected GoneException');
      } catch (err) {
        expect(err).toBeInstanceOf(GoneException);
        const response = (err as GoneException).getResponse() as any;
        expect(response.redirectUrl).toBe('https://auth.madfam.io/account/security');
        expect(response.authMode).toBe('janua');
      }
    });

    it('enableTotp should throw GoneException', async () => {
      await expect(provider.enableTotp('user-123', '123456')).rejects.toThrow(GoneException);
    });

    it('disableTotp should throw GoneException', async () => {
      await expect(provider.disableTotp('user-123', '654321')).rejects.toThrow(GoneException);
    });

    it('verifyToken should throw GoneException', () => {
      expect(() => provider.verifyToken('secret', '123456')).toThrow(GoneException);
    });

    it('verifyEncryptedToken should throw GoneException', () => {
      expect(() => provider.verifyEncryptedToken('encrypted', '123456')).toThrow(GoneException);
    });

    it('generateBackupCodes should throw GoneException', () => {
      expect(() => provider.generateBackupCodes()).toThrow(GoneException);
    });

    it('storeBackupCodes should throw GoneException', async () => {
      await expect(provider.storeBackupCodes('user-123', ['ABC12345'])).rejects.toThrow(
        GoneException
      );
    });

    it('verifyBackupCode should throw GoneException', async () => {
      await expect(provider.verifyBackupCode('user-123', 'ABC12345')).rejects.toThrow(
        GoneException
      );
    });
  });

  describe('interface compliance', () => {
    it('should implement all MfaProvider methods', () => {
      expect(typeof provider.setupTotp).toBe('function');
      expect(typeof provider.enableTotp).toBe('function');
      expect(typeof provider.disableTotp).toBe('function');
      expect(typeof provider.verifyToken).toBe('function');
      expect(typeof provider.verifyEncryptedToken).toBe('function');
      expect(typeof provider.generateBackupCodes).toBe('function');
      expect(typeof provider.storeBackupCodes).toBe('function');
      expect(typeof provider.verifyBackupCode).toBe('function');
    });
  });
});
