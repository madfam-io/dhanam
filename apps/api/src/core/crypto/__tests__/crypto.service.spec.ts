import { CryptoService } from '../crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;
  const originalEnv = process.env.ENCRYPTION_KEY;

  describe('with ENCRYPTION_KEY set', () => {
    beforeEach(() => {
      process.env.ENCRYPTION_KEY = 'test-encryption-key-12345';
      service = new CryptoService();
    });

    afterEach(() => {
      process.env.ENCRYPTION_KEY = originalEnv;
    });

    describe('encrypt', () => {
      it('should encrypt a string successfully', () => {
        const plaintext = 'sensitive-data';
        const encrypted = service.encrypt(plaintext);

        expect(encrypted).toBeDefined();
        expect(encrypted).not.toBe(plaintext);
        expect(encrypted.split(':')).toHaveLength(3);
      });

      it('should produce different ciphertext for same plaintext (due to random IV)', () => {
        const plaintext = 'test-data';
        const encrypted1 = service.encrypt(plaintext);
        const encrypted2 = service.encrypt(plaintext);

        expect(encrypted1).not.toBe(encrypted2);
      });

      it('should handle empty string encryption', () => {
        const encrypted = service.encrypt('');

        expect(encrypted).toBeDefined();
        expect(encrypted.split(':')).toHaveLength(3);
      });

      it('should handle unicode characters', () => {
        const plaintext = '🔐 Datos seguros con émojis';
        const encrypted = service.encrypt(plaintext);
        const decrypted = service.decrypt(encrypted);

        expect(decrypted).toBe(plaintext);
      });

      it('should handle very long strings', () => {
        const plaintext = 'A'.repeat(10000);
        const encrypted = service.encrypt(plaintext);
        const decrypted = service.decrypt(encrypted);

        expect(decrypted).toBe(plaintext);
      });
    });

    describe('decrypt', () => {
      it('should decrypt encrypted data correctly', () => {
        const plaintext = 'my-secret-data';
        const encrypted = service.encrypt(plaintext);
        const decrypted = service.decrypt(encrypted);

        expect(decrypted).toBe(plaintext);
      });

      it('should throw error for invalid encrypted data format - missing parts', () => {
        expect(() => service.decrypt('invalid-data')).toThrow(
          'Invalid encrypted data format'
        );
      });

      it('should throw error for invalid encrypted data format - only two parts', () => {
        expect(() => service.decrypt('part1:part2')).toThrow(
          'Invalid encrypted data format'
        );
      });

      it('should throw error for invalid encrypted data format - empty parts', () => {
        expect(() => service.decrypt('::')).toThrow('Invalid encrypted data format');
      });

      it('should throw error for invalid encrypted data format - empty iv', () => {
        expect(() => service.decrypt(':authTag:encrypted')).toThrow(
          'Invalid encrypted data format'
        );
      });

      it('should throw error for invalid encrypted data format - empty authTag', () => {
        expect(() => service.decrypt('iv::encrypted')).toThrow(
          'Invalid encrypted data format'
        );
      });

      it('should throw error for invalid encrypted data format - empty encrypted', () => {
        expect(() => service.decrypt('iv:authTag:')).toThrow(
          'Invalid encrypted data format'
        );
      });

      it('should throw error for tampered authTag', () => {
        const plaintext = 'sensitive';
        const encrypted = service.encrypt(plaintext);
        const parts = encrypted.split(':');
        // Tamper with the authTag
        parts[1] = '00'.repeat(16);
        const tampered = parts.join(':');

        expect(() => service.decrypt(tampered)).toThrow();
      });

      it('should throw error for tampered ciphertext', () => {
        const plaintext = 'sensitive';
        const encrypted = service.encrypt(plaintext);
        const parts = encrypted.split(':');
        // Tamper with the encrypted data
        parts[2] = '00'.repeat(parts[2].length / 2);
        const tampered = parts.join(':');

        expect(() => service.decrypt(tampered)).toThrow();
      });
    });

    describe('hash', () => {
      it('should produce consistent hash for same input', () => {
        const data = 'test-data';
        const hash1 = service.hash(data);
        const hash2 = service.hash(data);

        expect(hash1).toBe(hash2);
      });

      it('should produce different hashes for different inputs', () => {
        const hash1 = service.hash('data1');
        const hash2 = service.hash('data2');

        expect(hash1).not.toBe(hash2);
      });

      it('should return a 64-character hex string (SHA-256)', () => {
        const hash = service.hash('test');

        expect(hash).toHaveLength(64);
        expect(hash).toMatch(/^[a-f0-9]+$/);
      });

      it('should handle empty string', () => {
        const hash = service.hash('');

        expect(hash).toHaveLength(64);
        expect(hash).toMatch(/^[a-f0-9]+$/);
      });

      it('should handle unicode characters', () => {
        const hash = service.hash('🔐 encrypted');

        expect(hash).toHaveLength(64);
        expect(hash).toMatch(/^[a-f0-9]+$/);
      });

      it('should handle very long strings', () => {
        const data = 'A'.repeat(100000);
        const hash = service.hash(data);

        expect(hash).toHaveLength(64);
        expect(hash).toMatch(/^[a-f0-9]+$/);
      });
    });
  });

  describe('without ENCRYPTION_KEY (uses generated key)', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      delete process.env.ENCRYPTION_KEY;
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      process.env.ENCRYPTION_KEY = originalEnv;
      consoleWarnSpy.mockRestore();
    });

    it('should warn when ENCRYPTION_KEY is not set', () => {
      service = new CryptoService();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('ENCRYPTION_KEY not set')
      );
    });

    it('should still work with generated key', () => {
      service = new CryptoService();

      const plaintext = 'test-data';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should generate unique keys per instance (data not portable between instances)', () => {
      const service1 = new CryptoService();
      const service2 = new CryptoService();

      const encrypted = service1.encrypt('secret');

      // Different instances with generated keys cannot decrypt each other's data
      expect(() => service2.decrypt(encrypted)).toThrow();
    });
  });

  describe('key consistency', () => {
    it('should use same key for all operations within instance', () => {
      process.env.ENCRYPTION_KEY = 'consistent-key';
      service = new CryptoService();

      const data1 = 'first';
      const data2 = 'second';

      const encrypted1 = service.encrypt(data1);
      const encrypted2 = service.encrypt(data2);

      expect(service.decrypt(encrypted1)).toBe(data1);
      expect(service.decrypt(encrypted2)).toBe(data2);

      process.env.ENCRYPTION_KEY = originalEnv;
    });
  });
});
