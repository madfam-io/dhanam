import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { PrismaService } from '@core/prisma/prisma.service';
import { LoggerService } from '@core/logger/logger.service';
import { EmailService } from '@modules/email/email.service';

import { AuthService } from '../auth.service';
import { SessionService } from '../session.service';
import { TotpService } from '../totp.service';
import { RegisterDto, LoginDto, ResetPasswordDto } from '@dhanam/shared';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let sessionService: jest.Mocked<SessionService>;
  let totpService: jest.Mocked<TotpService>;
  let emailService: jest.Mocked<EmailService>;
  let logger: jest.Mocked<LoggerService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '\$argon2id\$v=19\$m=65536,t=3,p=4\$hashedpassword',
    totpSecret: null,
    totpEnabled: false,
    isActive: true,
    locale: 'es',
    timezone: 'America/Mexico_City',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      space: {
        create: jest.fn(),
      },
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockSessionService = {
      createRefreshToken: jest.fn(),
      validateRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      revokeAllUserSessions: jest.fn(),
      createPasswordResetToken: jest.fn(),
      validatePasswordResetToken: jest.fn(),
    };

    const mockTotpService = {
      verifyToken: jest.fn(),
    };

    const mockEmailService = {
      sendWelcomeEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: TotpService, useValue: mockTotpService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
    sessionService = module.get(SessionService);
    totpService = module.get(TotpService);
    emailService = module.get(EmailService);
    logger = module.get(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      name: 'New User',
      locale: 'es',
      timezone: 'America/Mexico_City',
    };

    it('should register a new user with hashed password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser as any);
      prisma.space.create.mockResolvedValue({} as any);
      jwtService.sign.mockReturnValue('mock-access-token');
      sessionService.createRefreshToken.mockResolvedValue('mock-refresh-token');

      const result = await service.register(registerDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: registerDto.email,
          name: registerDto.name,
          locale: registerDto.locale,
          timezone: registerDto.timezone,
          passwordHash: expect.any(String),
        }),
      });

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 15 * 60,
      });
    });

    it('should reject duplicate emails', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
    };

    it('should login with valid credentials', async () => {
      const userWithPassword = { ...mockUser, passwordHash: await argon2.hash(loginDto.password) };
      prisma.user.findUnique.mockResolvedValue(userWithPassword as any);
      prisma.user.update.mockResolvedValue(userWithPassword as any);
      jwtService.sign.mockReturnValue('mock-access-token');
      sessionService.createRefreshToken.mockResolvedValue('mock-refresh-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 15 * 60,
      });
    });

    it('should reject invalid passwords', async () => {
      const userWithPassword = { ...mockUser, passwordHash: await argon2.hash('DifferentPassword') };
      prisma.user.findUnique.mockResolvedValue(userWithPassword as any);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
