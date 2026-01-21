import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { GuestAuthService } from '../guest-auth.service';
import { PrismaService } from '@core/prisma/prisma.service';

describe('GuestAuthService', () => {
  let service: GuestAuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockGuestUser = {
    id: 'guest-user-id',
    email: 'guest@dhanam.demo',
    name: 'Guest User',
    passwordHash: 'GUEST_NO_PASSWORD',
    locale: 'en',
    timezone: 'America/Mexico_City',
    emailVerified: true,
    onboardingCompleted: true,
    onboardingCompletedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    totpSecret: null,
    totpEnabled: false,
    isActive: true,
    lastLoginAt: null,
  };

  const mockSpace = {
    id: 'guest-space-id',
    name: 'Demo Personal Finance',
    type: 'personal',
    currency: 'MXN',
    timezone: 'America/Mexico_City',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      space: {
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestAuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<GuestAuthService>(GuestAuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGuestSession', () => {
    it('should create guest session for existing guest user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockGuestUser as any);
      jwtService.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');
      configService.get.mockReturnValue('test-refresh-secret');
      prisma.auditLog.create.mockResolvedValue({} as any);

      const result = await service.createGuestSession();

      expect(result).toEqual({
        user: mockGuestUser,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
      });
    });

    it('should create new guest user if not exists', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockGuestUser as any);
      prisma.space.create.mockResolvedValue(mockSpace as any);
      jwtService.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');
      configService.get.mockReturnValue('test-refresh-secret');
      prisma.auditLog.create.mockResolvedValue({} as any);

      const result = await service.createGuestSession();

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'guest@dhanam.demo',
          name: 'Guest User',
          passwordHash: 'GUEST_NO_PASSWORD',
          emailVerified: true,
          onboardingCompleted: true,
        }),
      });
      expect(result.user).toEqual(mockGuestUser);
    });

    it('should create demo space for new guest user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockGuestUser as any);
      prisma.space.create.mockResolvedValue(mockSpace as any);
      jwtService.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');
      configService.get.mockReturnValue('test-refresh-secret');
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.createGuestSession();

      expect(prisma.space.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Demo Personal Finance',
          type: 'personal',
          currency: 'MXN',
          userSpaces: {
            create: {
              userId: mockGuestUser.id,
              role: 'viewer',
            },
          },
        }),
      });
    });

    it('should generate access token with guest permissions', async () => {
      prisma.user.findUnique.mockResolvedValue(mockGuestUser as any);
      jwtService.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');
      configService.get.mockReturnValue('test-refresh-secret');
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.createGuestSession();

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockGuestUser.id,
          email: mockGuestUser.email,
          isGuest: true,
          permissions: ['read'],
        }),
        { expiresIn: '1h' }
      );
    });

    it('should generate refresh token with shorter expiration', async () => {
      prisma.user.findUnique.mockResolvedValue(mockGuestUser as any);
      jwtService.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');
      configService.get.mockReturnValue('test-refresh-secret');
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.createGuestSession();

      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          sub: mockGuestUser.id,
          isGuest: true,
          type: 'refresh',
        }),
        expect.objectContaining({
          secret: 'test-refresh-secret',
          expiresIn: '2h',
        })
      );
    });

    it('should create audit log entry for session creation', async () => {
      prisma.user.findUnique.mockResolvedValue(mockGuestUser as any);
      jwtService.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');
      configService.get.mockReturnValue('test-refresh-secret');
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.createGuestSession();

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockGuestUser.id,
          action: 'guest.session_created',
          ipAddress: 'guest',
          userAgent: 'guest-access',
        }),
      });
    });

    it('should return correct expiration time (1 hour)', async () => {
      prisma.user.findUnique.mockResolvedValue(mockGuestUser as any);
      jwtService.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');
      configService.get.mockReturnValue('test-refresh-secret');
      prisma.auditLog.create.mockResolvedValue({} as any);

      const result = await service.createGuestSession();

      expect(result.expiresIn).toBe(3600);
    });
  });

  describe('isGuestSession', () => {
    it('should return true for valid guest token', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'guest-user-id',
        isGuest: true,
      });

      const result = await service.isGuestSession('valid-guest-token');

      expect(result).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('valid-guest-token');
    });

    it('should return false for non-guest token', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'regular-user-id',
        isGuest: false,
      });

      const result = await service.isGuestSession('non-guest-token');

      expect(result).toBe(false);
    });

    it('should return false for token without isGuest flag', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'user-id',
      });

      const result = await service.isGuestSession('token-without-guest-flag');

      expect(result).toBe(false);
    });

    it('should return false for invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.isGuestSession('invalid-token');

      expect(result).toBe(false);
    });

    it('should return false for expired token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      const result = await service.isGuestSession('expired-token');

      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredGuestSessions', () => {
    it('should delete audit logs older than 2 days', async () => {
      prisma.auditLog.deleteMany.mockResolvedValue({ count: 5 });

      await service.cleanupExpiredGuestSessions();

      expect(prisma.auditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          action: 'guest.session_created',
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should calculate correct date threshold (2 days ago)', async () => {
      prisma.auditLog.deleteMany.mockResolvedValue({ count: 0 });

      const beforeCall = new Date();
      await service.cleanupExpiredGuestSessions();
      const afterCall = new Date();

      const deleteCall = prisma.auditLog.deleteMany.mock.calls[0][0];
      const thresholdDate = deleteCall.where.createdAt.lt;

      // The threshold should be approximately 2 days before now
      const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
      const expectedMin = new Date(beforeCall.getTime() - twoDaysInMs - 1000);
      const expectedMax = new Date(afterCall.getTime() - twoDaysInMs + 1000);

      expect(thresholdDate.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
      expect(thresholdDate.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    });

    it('should handle no sessions to cleanup', async () => {
      prisma.auditLog.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.cleanupExpiredGuestSessions()).resolves.not.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      prisma.auditLog.deleteMany.mockRejectedValue(new Error('Database error'));

      await expect(service.cleanupExpiredGuestSessions()).rejects.toThrow('Database error');
    });
  });

  describe('getOrCreateGuestUser (private method behavior)', () => {
    it('should reuse existing guest user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockGuestUser as any);
      jwtService.sign.mockReturnValue('token');
      configService.get.mockReturnValue('secret');
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.createGuestSession();
      await service.createGuestSession();

      // findUnique should be called but create should not
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should search for guest user by email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockGuestUser as any);
      jwtService.sign.mockReturnValue('token');
      configService.get.mockReturnValue('secret');
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.createGuestSession();

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'guest@dhanam.demo' },
      });
    });
  });
});
