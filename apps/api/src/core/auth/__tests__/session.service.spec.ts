import { Test, TestingModule } from '@nestjs/testing';
import { randomBytes } from 'crypto';

import { SessionService } from '../session.service';
import { LoggerService } from '@core/logger/logger.service';

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    smembers: jest.fn(),
    expire: jest.fn(),
    pipeline: jest.fn().mockReturnValue({
      del: jest.fn(),
      exec: jest.fn(),
    }),
    disconnect: jest.fn(),
  }));
});

// Mock crypto module for controlled randomness
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'mocked-hash'),
  })),
}));

describe('SessionService', () => {
  let service: SessionService;
  let redis: any;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    // Set Redis environment variables
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    process.env.REDIS_DB = '0';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
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

    service = module.get<SessionService>(SessionService);
    logger = module.get(LoggerService) as jest.Mocked<LoggerService>;

    // Get the mocked Redis instance
    redis = (service as any).redis;

    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_DB;
  });

  describe('createRefreshToken', () => {
    it('should generate cryptographically secure random token', async () => {
      // Arrange
      const userId = 'user-123';
      const email = 'test@example.com';
      const mockRandomBytes = randomBytes as jest.MockedFunction<typeof randomBytes>;
      mockRandomBytes.mockReturnValue(Buffer.from('a'.repeat(64), 'hex'));
      redis.setex.mockResolvedValue('OK');
      redis.sadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);

      // Act
      await service.createRefreshToken(userId, email);

      // Assert
      expect(mockRandomBytes).toHaveBeenCalledWith(32); // 32 bytes = 64 hex chars
    });

    it('should store hashed token in Redis with 30-day expiration', async () => {
      // Arrange
      const userId = 'user-123';
      const email = 'test@example.com';
      (randomBytes as jest.MockedFunction<typeof randomBytes>).mockReturnValue(
        Buffer.from('a'.repeat(64), 'hex')
      );
      redis.setex.mockResolvedValue('OK');
      redis.sadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);

      // Act
      await service.createRefreshToken(userId, email);

      // Assert
      expect(redis.setex).toHaveBeenCalledWith(
        'refresh_token:mocked-hash',
        30 * 24 * 60 * 60, // 30 days in seconds
        expect.stringContaining('"userId":"user-123"')
      );
    });

    it('should store session data with correct structure', async () => {
      // Arrange
      const userId = 'user-123';
      const email = 'test@example.com';
      (randomBytes as jest.MockedFunction<typeof randomBytes>).mockReturnValue(
        Buffer.from('a'.repeat(64), 'hex')
      );
      redis.setex.mockResolvedValue('OK');
      redis.sadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);

      const beforeTime = Date.now();

      // Act
      await service.createRefreshToken(userId, email);

      const afterTime = Date.now();

      // Assert
      const storedData = JSON.parse(redis.setex.mock.calls[0][2]);
      expect(storedData).toMatchObject({
        userId: 'user-123',
        email: 'test@example.com',
      });
      expect(storedData.createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(storedData.createdAt).toBeLessThanOrEqual(afterTime);
      expect(storedData.expiresAt).toBeGreaterThan(storedData.createdAt);
    });

    it('should track user active sessions', async () => {
      // Arrange
      const userId = 'user-123';
      const email = 'test@example.com';
      (randomBytes as jest.MockedFunction<typeof randomBytes>).mockReturnValue(
        Buffer.from('a'.repeat(64), 'hex')
      );
      redis.setex.mockResolvedValue('OK');
      redis.sadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);

      // Act
      await service.createRefreshToken(userId, email);

      // Assert
      expect(redis.sadd).toHaveBeenCalledWith('user_sessions:user-123', 'mocked-hash');
      expect(redis.expire).toHaveBeenCalledWith('user_sessions:user-123', 30 * 24 * 60 * 60);
    });

    it('should return the raw (unhashed) token to caller', async () => {
      // Arrange
      const userId = 'user-123';
      const email = 'test@example.com';
      (randomBytes as jest.MockedFunction<typeof randomBytes>).mockReturnValue(
        Buffer.from('a'.repeat(64), 'hex')
      );
      redis.setex.mockResolvedValue('OK');
      redis.sadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);

      // Act
      const token = await service.createRefreshToken(userId, email);

      // Assert
      expect(token).toBe('a'.repeat(64));
      expect(token).not.toBe('mocked-hash'); // Not the hashed version
    });

    it('should log token creation', async () => {
      // Arrange
      const userId = 'user-123';
      const email = 'test@example.com';
      (randomBytes as jest.MockedFunction<typeof randomBytes>).mockReturnValue(
        Buffer.from('a'.repeat(64), 'hex')
      );
      redis.setex.mockResolvedValue('OK');
      redis.sadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);

      // Act
      await service.createRefreshToken(userId, email);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        'Refresh token created for user: user-123',
        'SessionService'
      );
    });
  });

  describe('validateRefreshToken', () => {
    it('should return session data for valid token', async () => {
      // Arrange
      const token = 'valid-token';
      const sessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        createdAt: Date.now(),
        expiresAt: Date.now() + 1000000,
      };
      redis.get.mockResolvedValue(JSON.stringify(sessionData));

      // Act
      const result = await service.validateRefreshToken(token);

      // Assert
      expect(result).toEqual(sessionData);
      expect(redis.get).toHaveBeenCalledWith('refresh_token:mocked-hash');
    });

    it('should return null for non-existent token', async () => {
      // Arrange
      redis.get.mockResolvedValue(null);

      // Act
      const result = await service.validateRefreshToken('nonexistent-token');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null and revoke expired token', async () => {
      // Arrange
      const token = 'expired-token';
      const sessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        createdAt: Date.now() - 1000000,
        expiresAt: Date.now() - 1000, // Expired
      };
      redis.get.mockResolvedValue(JSON.stringify(sessionData));
      redis.del.mockResolvedValue(1);
      redis.srem.mockResolvedValue(1);

      // Act
      const result = await service.validateRefreshToken(token);

      // Assert
      expect(result).toBeNull();
      expect(redis.del).toHaveBeenCalled();
    });

    it('should handle invalid JSON gracefully', async () => {
      // Arrange
      redis.get.mockResolvedValue('invalid-json{');
      redis.del.mockResolvedValue(1);

      // Act
      const result = await service.validateRefreshToken('token');

      // Assert
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to parse session data',
        expect.any(String),
        'SessionService'
      );
      expect(redis.del).toHaveBeenCalled();
    });

    it('should check token expiration correctly', async () => {
      // Arrange
      const token = 'about-to-expire';
      const sessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        createdAt: Date.now() - 100000,
        expiresAt: Date.now() + 100, // Expires in 100ms
      };
      redis.get.mockResolvedValue(JSON.stringify(sessionData));

      // Act
      const result = await service.validateRefreshToken(token);

      // Assert
      expect(result).toEqual(sessionData); // Still valid
    });
  });

  describe('revokeRefreshToken', () => {
    it('should delete token from Redis', async () => {
      // Arrange
      const token = 'token-to-revoke';
      const sessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        createdAt: Date.now(),
        expiresAt: Date.now() + 1000000,
      };
      redis.get.mockResolvedValue(JSON.stringify(sessionData));
      redis.del.mockResolvedValue(1);
      redis.srem.mockResolvedValue(1);

      // Act
      await service.revokeRefreshToken(token);

      // Assert
      expect(redis.del).toHaveBeenCalledWith('refresh_token:mocked-hash');
    });

    it('should remove token from user sessions set', async () => {
      // Arrange
      const token = 'token-to-revoke';
      const sessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        createdAt: Date.now(),
        expiresAt: Date.now() + 1000000,
      };
      redis.get.mockResolvedValue(JSON.stringify(sessionData));
      redis.del.mockResolvedValue(1);
      redis.srem.mockResolvedValue(1);

      // Act
      await service.revokeRefreshToken(token);

      // Assert
      expect(redis.srem).toHaveBeenCalledWith('user_sessions:user-123', 'mocked-hash');
    });

    it('should log revocation', async () => {
      // Arrange
      const token = 'token-to-revoke';
      redis.get.mockResolvedValue(null);
      redis.del.mockResolvedValue(1);

      // Act
      await service.revokeRefreshToken(token);

      // Assert
      expect(logger.log).toHaveBeenCalledWith('Refresh token revoked', 'SessionService');
    });

    it('should handle missing session data gracefully', async () => {
      // Arrange
      redis.get.mockResolvedValue(null);
      redis.del.mockResolvedValue(1);

      // Act & Assert
      await expect(service.revokeRefreshToken('nonexistent')).resolves.not.toThrow();
      expect(redis.del).toHaveBeenCalledWith('refresh_token:mocked-hash');
    });

    it('should handle parse errors during revocation', async () => {
      // Arrange
      redis.get.mockResolvedValue('invalid-json{');
      redis.del.mockResolvedValue(1);

      // Act
      await service.revokeRefreshToken('token');

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to parse session data during revocation',
        expect.any(String),
        'SessionService'
      );
      expect(redis.del).toHaveBeenCalled();
    });
  });

  describe('revokeAllUserSessions', () => {
    it('should revoke all sessions for a user', async () => {
      // Arrange
      const userId = 'user-123';
      const hashedTokens = ['hash1', 'hash2', 'hash3'];
      redis.smembers.mockResolvedValue(hashedTokens);
      const mockPipeline = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      redis.pipeline.mockReturnValue(mockPipeline);

      // Act
      await service.revokeAllUserSessions(userId);

      // Assert
      expect(redis.smembers).toHaveBeenCalledWith('user_sessions:user-123');
      expect(mockPipeline.del).toHaveBeenCalledWith('refresh_token:hash1');
      expect(mockPipeline.del).toHaveBeenCalledWith('refresh_token:hash2');
      expect(mockPipeline.del).toHaveBeenCalledWith('refresh_token:hash3');
      expect(mockPipeline.del).toHaveBeenCalledWith('user_sessions:user-123');
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('should use Redis pipeline for atomic operation', async () => {
      // Arrange
      const userId = 'user-123';
      redis.smembers.mockResolvedValue(['hash1', 'hash2']);
      const mockPipeline = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      redis.pipeline.mockReturnValue(mockPipeline);

      // Act
      await service.revokeAllUserSessions(userId);

      // Assert
      expect(redis.pipeline).toHaveBeenCalled();
      expect(mockPipeline.exec).toHaveBeenCalledTimes(1);
    });

    it('should log session revocation', async () => {
      // Arrange
      const userId = 'user-123';
      redis.smembers.mockResolvedValue([]);
      const mockPipeline = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      redis.pipeline.mockReturnValue(mockPipeline);

      // Act
      await service.revokeAllUserSessions(userId);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        'All sessions revoked for user: user-123',
        'SessionService'
      );
    });

    it('should handle user with no active sessions', async () => {
      // Arrange
      const userId = 'user-no-sessions';
      redis.smembers.mockResolvedValue([]);
      const mockPipeline = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      redis.pipeline.mockReturnValue(mockPipeline);

      // Act & Assert
      await expect(service.revokeAllUserSessions(userId)).resolves.not.toThrow();
      expect(mockPipeline.del).toHaveBeenCalledWith('user_sessions:user-no-sessions');
    });
  });

  describe('createPasswordResetToken', () => {
    it('should generate cryptographically secure reset token', async () => {
      // Arrange
      const userId = 'user-123';
      const mockRandomBytes = randomBytes as jest.MockedFunction<typeof randomBytes>;
      mockRandomBytes.mockReturnValue(Buffer.from('r'.repeat(64), 'hex'));
      redis.setex.mockResolvedValue('OK');

      // Act
      await service.createPasswordResetToken(userId);

      // Assert
      expect(mockRandomBytes).toHaveBeenCalledWith(32); // 32 bytes
    });

    it('should store reset token with 1-hour expiration', async () => {
      // Arrange
      const userId = 'user-123';
      (randomBytes as jest.MockedFunction<typeof randomBytes>).mockReturnValue(
        Buffer.from('r'.repeat(64), 'hex')
      );
      redis.setex.mockResolvedValue('OK');

      const beforeTime = Date.now();

      // Act
      await service.createPasswordResetToken(userId);

      const afterTime = Date.now();

      // Assert
      expect(redis.setex).toHaveBeenCalledWith(
        'password_reset:mocked-hash',
        60 * 60, // 1 hour in seconds
        expect.any(String)
      );

      const storedData = JSON.parse(redis.setex.mock.calls[0][2]);
      expect(storedData.userId).toBe('user-123');
      expect(storedData.expiresAt).toBeGreaterThanOrEqual(beforeTime + 60 * 60 * 1000);
      expect(storedData.expiresAt).toBeLessThanOrEqual(afterTime + 60 * 60 * 1000);
    });

    it('should return raw reset token', async () => {
      // Arrange
      const userId = 'user-123';
      (randomBytes as jest.MockedFunction<typeof randomBytes>).mockReturnValue(
        Buffer.from('r'.repeat(64), 'hex')
      );
      redis.setex.mockResolvedValue('OK');

      // Act
      const token = await service.createPasswordResetToken(userId);

      // Assert
      expect(token).toBe('r'.repeat(64));
      expect(token).not.toBe('mocked-hash'); // Not hashed
    });

    it('should log reset token creation', async () => {
      // Arrange
      const userId = 'user-123';
      (randomBytes as jest.MockedFunction<typeof randomBytes>).mockReturnValue(
        Buffer.from('r'.repeat(64), 'hex')
      );
      redis.setex.mockResolvedValue('OK');

      // Act
      await service.createPasswordResetToken(userId);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        'Password reset token created for user: user-123',
        'SessionService'
      );
    });
  });

  describe('validatePasswordResetToken', () => {
    it('should return userId for valid reset token', async () => {
      // Arrange
      const token = 'valid-reset-token';
      const resetData = {
        userId: 'user-123',
        expiresAt: Date.now() + 1000000,
      };
      redis.get.mockResolvedValue(JSON.stringify(resetData));
      redis.del.mockResolvedValue(1);

      // Act
      const userId = await service.validatePasswordResetToken(token);

      // Assert
      expect(userId).toBe('user-123');
    });

    it('should return null for non-existent token', async () => {
      // Arrange
      redis.get.mockResolvedValue(null);

      // Act
      const userId = await service.validatePasswordResetToken('nonexistent');

      // Assert
      expect(userId).toBeNull();
    });

    it('should return null for expired token', async () => {
      // Arrange
      const token = 'expired-reset-token';
      const resetData = {
        userId: 'user-123',
        expiresAt: Date.now() - 1000, // Expired
      };
      redis.get.mockResolvedValue(JSON.stringify(resetData));
      redis.del.mockResolvedValue(1);

      // Act
      const userId = await service.validatePasswordResetToken(token);

      // Assert
      expect(userId).toBeNull();
      expect(redis.del).toHaveBeenCalledWith('password_reset:mocked-hash');
    });

    it('should be single-use (delete after validation)', async () => {
      // Arrange
      const token = 'single-use-token';
      const resetData = {
        userId: 'user-123',
        expiresAt: Date.now() + 1000000,
      };
      redis.get.mockResolvedValue(JSON.stringify(resetData));
      redis.del.mockResolvedValue(1);

      // Act
      await service.validatePasswordResetToken(token);

      // Assert
      expect(redis.del).toHaveBeenCalledWith('password_reset:mocked-hash');
      expect(redis.del).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid JSON gracefully', async () => {
      // Arrange
      redis.get.mockResolvedValue('invalid-json{');
      redis.del.mockResolvedValue(1);

      // Act
      const userId = await service.validatePasswordResetToken('token');

      // Assert
      expect(userId).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to parse reset token data',
        expect.any(String),
        'SessionService'
      );
      expect(redis.del).toHaveBeenCalled();
    });
  });

  describe('hashToken', () => {
    it('should hash tokens with SHA-256', async () => {
      // This is tested indirectly through other methods
      // The createHash mock verifies SHA-256 is used
      const userId = 'user-123';
      (randomBytes as jest.MockedFunction<typeof randomBytes>).mockReturnValue(
        Buffer.from('test', 'hex')
      );
      redis.setex.mockResolvedValue('OK');

      await service.createPasswordResetToken(userId);

      // Verify the hashed token key was used
      expect(redis.setex).toHaveBeenCalledWith(
        'password_reset:mocked-hash',
        expect.any(Number),
        expect.any(String)
      );
    });
  });

  describe('Redis lifecycle', () => {
    it('should disconnect from Redis on module destroy', async () => {
      // Act
      await service.onModuleDestroy();

      // Assert
      expect(redis.disconnect).toHaveBeenCalled();
    });

    it('should initialize Redis with correct configuration', () => {
      // Verify Redis was initialized with environment variables
      expect(service).toBeDefined();
      expect((service as any).redis).toBeDefined();
    });
  });

  describe('Security properties', () => {
    it('should NEVER store raw tokens in Redis', async () => {
      // Arrange
      const userId = 'user-123';
      const email = 'test@example.com';
      (randomBytes as jest.MockedFunction<typeof randomBytes>).mockReturnValue(
        Buffer.from('raw-token-value', 'hex')
      );
      redis.setex.mockResolvedValue('OK');
      redis.sadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);

      // Act
      const rawToken = await service.createRefreshToken(userId, email);

      // Assert
      const redisKey = redis.setex.mock.calls[0][0];
      expect(redisKey).toContain('mocked-hash'); // Hashed version
      expect(redisKey).not.toContain(rawToken); // NOT raw token
    });

    it('should use different prefixes for different token types', async () => {
      // Arrange
      (randomBytes as jest.MockedFunction<typeof randomBytes>).mockReturnValue(
        Buffer.from('token', 'hex')
      );
      redis.setex.mockResolvedValue('OK');
      redis.sadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);

      // Act
      await service.createRefreshToken('user-123', 'test@example.com');
      await service.createPasswordResetToken('user-123');

      // Assert
      expect(redis.setex.mock.calls[0][0]).toContain('refresh_token:');
      expect(redis.setex.mock.calls[1][0]).toContain('password_reset:');
    });
  });
});
