import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../common/services/prisma.service';
import { CryptoService } from '../../../common/services/crypto.service';
import { TwoFactorService } from './two-factor.service';
import { SessionService } from './session.service';
import { hash, verify } from 'argon2';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaService>;
  let jwtService: DeepMockProxy<JwtService>;
  let cryptoService: DeepMockProxy<CryptoService>;
  let twoFactorService: DeepMockProxy<TwoFactorService>;
  let sessionService: DeepMockProxy<SessionService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
        {
          provide: JwtService,
          useValue: mockDeep<JwtService>(),
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'jwt.access.expiresIn': '15m',
                'jwt.refresh.expiresIn': '30d',
              };
              return config[key];
            }),
          },
        },
        {
          provide: CryptoService,
          useValue: mockDeep<CryptoService>(),
        },
        {
          provide: TwoFactorService,
          useValue: mockDeep<TwoFactorService>(),
        },
        {
          provide: SessionService,
          useValue: mockDeep<SessionService>(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
    cryptoService = module.get(CryptoService);
    twoFactorService = module.get(TwoFactorService);
    sessionService = module.get(SessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        locale: 'en' as const,
        timezone: 'UTC',
      };

      const hashedPassword = 'hashed_password';
      const userId = 'user_id';
      const accessToken = 'access_token';
      const refreshToken = 'refresh_token';
      const tokenFamily = 'token_family';

      prisma.user.findUnique.mockResolvedValue(null);
      (hash as jest.Mock).mockResolvedValue(hashedPassword);
      prisma.user.create.mockResolvedValue({
        id: userId,
        email: registerDto.email,
        name: registerDto.name,
        passwordHash: hashedPassword,
        locale: registerDto.locale,
        timezone: registerDto.timezone,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        totpSecret: null,
        totpEnabled: false,
      });

      cryptoService.generateId.mockReturnValue(tokenFamily);
      jwtService.sign.mockReturnValueOnce(accessToken).mockReturnValueOnce(refreshToken);
      sessionService.createSession.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        user: expect.objectContaining({
          id: userId,
          email: registerDto.email,
        }),
        accessToken,
        refreshToken,
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: registerDto.email,
          passwordHash: hashedPassword,
        }),
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
        locale: 'en' as const,
        timezone: 'UTC',
      };

      prisma.user.findUnique.mockResolvedValue({
        id: 'existing_user',
        email: registerDto.email,
        name: 'Existing User',
        passwordHash: 'hash',
        locale: 'en',
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        totpSecret: null,
        totpEnabled: false,
      });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
        totpCode: undefined,
      };

      const user = {
        id: 'user_id',
        email: loginDto.email,
        passwordHash: 'hashed_password',
        totpEnabled: false,
        name: 'Test User',
        locale: 'en' as const,
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        totpSecret: null,
      };

      const accessToken = 'access_token';
      const refreshToken = 'refresh_token';
      const tokenFamily = 'token_family';

      prisma.user.findUnique.mockResolvedValue(user);
      (verify as jest.Mock).mockResolvedValue(true);
      cryptoService.generateId.mockReturnValue(tokenFamily);
      jwtService.sign.mockReturnValueOnce(accessToken).mockReturnValueOnce(refreshToken);
      sessionService.createSession.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        user: expect.objectContaining({
          id: user.id,
          email: user.email,
        }),
        accessToken,
        refreshToken,
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrong_password',
        totpCode: undefined,
      };

      prisma.user.findUnique.mockResolvedValue({
        id: 'user_id',
        email: loginDto.email,
        passwordHash: 'hashed_password',
        totpEnabled: false,
        name: 'Test User',
        locale: 'en' as const,
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        totpSecret: null,
      });

      (verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should validate TOTP if enabled', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
        totpCode: '123456',
      };

      const user = {
        id: 'user_id',
        email: loginDto.email,
        passwordHash: 'hashed_password',
        totpEnabled: true,
        totpSecret: 'secret',
        name: 'Test User',
        locale: 'en' as const,
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
      };

      prisma.user.findUnique.mockResolvedValue(user);
      (verify as jest.Mock).mockResolvedValue(true);
      twoFactorService.verifyTotp.mockResolvedValue(true);

      const accessToken = 'access_token';
      const refreshToken = 'refresh_token';
      const tokenFamily = 'token_family';

      cryptoService.generateId.mockReturnValue(tokenFamily);
      jwtService.sign.mockReturnValueOnce(accessToken).mockReturnValueOnce(refreshToken);
      sessionService.createSession.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(twoFactorService.verifyTotp).toHaveBeenCalledWith(user.id, loginDto.totpCode);
      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token with valid refresh token', async () => {
      const oldRefreshToken = 'old_refresh_token';
      const userId = 'user_id';
      const tokenFamily = 'token_family';
      const newAccessToken = 'new_access_token';
      const newRefreshToken = 'new_refresh_token';

      jwtService.verify.mockReturnValue({ sub: userId, tokenFamily });
      sessionService.validateSession.mockResolvedValue(true);
      sessionService.rotateRefreshToken.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValueOnce(newAccessToken).mockReturnValueOnce(newRefreshToken);

      const result = await service.refreshToken(oldRefreshToken);

      expect(result).toEqual({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });

      expect(sessionService.rotateRefreshToken).toHaveBeenCalledWith(
        userId,
        tokenFamily,
        oldRefreshToken
      );
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const invalidToken = 'invalid_token';

      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(invalidToken)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});