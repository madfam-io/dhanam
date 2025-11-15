import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { AuthService } from '../auth.service';
import { SessionService } from '../session.service';
import { TotpService } from '../totp.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { LoggerService } from '@core/logger/logger.service';
import { EmailService } from '@modules/email/email.service';

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
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$mockedhash',
    locale: 'en',
    timezone: 'America/New_York',
    totpSecret: null,
    totpEnabled: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            space: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            createRefreshToken: jest.fn(),
            validateRefreshToken: jest.fn(),
            revokeRefreshToken: jest.fn(),
            revokeAllUserSessions: jest.fn(),
            createPasswordResetToken: jest.fn(),
            validatePasswordResetToken: jest.fn(),
          },
        },
        {
          provide: TotpService,
          useValue: {
            verifyToken: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendWelcomeEmail: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
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

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    sessionService = module.get(SessionService) as jest.Mocked<SessionService>;
    totpService = module.get(TotpService) as jest.Mocked<TotpService>;
    emailService = module.get(EmailService) as jest.Mocked<EmailService>;
    logger = module.get(LoggerService) as jest.Mocked<LoggerService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      name: 'New User',
      locale: 'es',
      timezone: 'America/Mexico_City',
    };

    it('should successfully register a new user', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.space.create.mockResolvedValue({} as any);
      jwtService.sign.mockReturnValue('mock-access-token');
      sessionService.createRefreshToken.mockResolvedValue('mock-refresh-token');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.space.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: expect.stringContaining('Personal'),
          type: 'personal',
          currency: 'MXN',
        }),
      });
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.name
      );
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 900, // 15 minutes
      });
    });

    it('should hash password with Argon2id and correct parameters', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);
      const hashSpy = jest.spyOn(argon2, 'hash');
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.space.create.mockResolvedValue({} as any);
      jwtService.sign.mockReturnValue('mock-token');
      sessionService.createRefreshToken.mockResolvedValue('mock-refresh');

      // Act
      await service.register(registerDto);

      // Assert
      expect(hashSpy).toHaveBeenCalledWith(registerDto.password, {
        type: argon2.argon2id,
        memoryCost: 65536, // 64 MB
        timeCost: 3,
        parallelism: 4,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'User already exists'
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should use default locale and timezone if not provided', async () => {
      // Arrange
      const dtoWithoutLocale = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test',
      };
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser as any);
      prisma.space.create.mockResolvedValue({} as any);
      jwtService.sign.mockReturnValue('token');
      sessionService.createRefreshToken.mockResolvedValue('refresh');

      // Act
      await service.register(dtoWithoutLocale as any);

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          locale: 'es', // default
          timezone: 'America/Mexico_City', // default
        }),
      });
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'CorrectPassword123!',
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      const userWithPassword = { ...mockUser, passwordHash: 'hashed' };
      prisma.user.findUnique.mockResolvedValue(userWithPassword as any);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);
      prisma.user.update.mockResolvedValue(mockUser as any);
      jwtService.sign.mockReturnValue('access-token');
      sessionService.createRefreshToken.mockResolvedValue('refresh-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      prisma.user.findUnique.mockResolvedValue(inactiveUser as any);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    describe('with TOTP enabled', () => {
      const loginDtoWithTotp = {
        ...loginDto,
        totpCode: '123456',
      };

      it('should require TOTP code when TOTP is enabled', async () => {
        // Arrange
        const userWithTotp = { ...mockUser, totpSecret: 'SECRET', totpEnabled: true };
        prisma.user.findUnique.mockResolvedValue(userWithTotp as any);
        jest.spyOn(argon2, 'verify').mockResolvedValue(true);

        // Act & Assert
        await expect(service.login(loginDto)).rejects.toThrow(
          UnauthorizedException
        );
        await expect(service.login(loginDto)).rejects.toThrow(
          'TOTP code required'
        );
      });

      it('should successfully login with valid TOTP code', async () => {
        // Arrange
        const userWithTotp = { ...mockUser, totpSecret: 'SECRET', totpEnabled: true };
        prisma.user.findUnique.mockResolvedValue(userWithTotp as any);
        jest.spyOn(argon2, 'verify').mockResolvedValue(true);
        totpService.verifyToken.mockReturnValue(true);
        prisma.user.update.mockResolvedValue(mockUser as any);
        jwtService.sign.mockReturnValue('token');
        sessionService.createRefreshToken.mockResolvedValue('refresh');

        // Act
        const result = await service.login(loginDtoWithTotp);

        // Assert
        expect(totpService.verifyToken).toHaveBeenCalledWith('SECRET', '123456');
        expect(result.accessToken).toBe('token');
      });

      it('should throw UnauthorizedException for invalid TOTP code', async () => {
        // Arrange
        const userWithTotp = { ...mockUser, totpSecret: 'SECRET', totpEnabled: true };
        prisma.user.findUnique.mockResolvedValue(userWithTotp as any);
        jest.spyOn(argon2, 'verify').mockResolvedValue(true);
        totpService.verifyToken.mockReturnValue(false);

        // Act & Assert
        await expect(service.login(loginDtoWithTotp)).rejects.toThrow(
          'Invalid TOTP code'
        );
      });
    });
  });

  describe('refreshTokens', () => {
    const refreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should successfully refresh tokens', async () => {
      // Arrange
      const sessionData = {
        userId: mockUser.id,
        email: mockUser.email,
      };
      sessionService.validateRefreshToken.mockResolvedValue(sessionData);
      sessionService.revokeRefreshToken.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValue('new-access-token');
      sessionService.createRefreshToken.mockResolvedValue('new-refresh-token');

      // Act
      const result = await service.refreshTokens(refreshTokenDto);

      // Assert
      expect(sessionService.validateRefreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken
      );
      expect(sessionService.revokeRefreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken
      );
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900,
      });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      // Arrange
      sessionService.validateRefreshToken.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshTokens(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.refreshTokens(refreshTokenDto)).rejects.toThrow(
        'Invalid refresh token'
      );
      expect(sessionService.revokeRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should successfully revoke refresh token', async () => {
      // Arrange
      const refreshToken = 'token-to-revoke';
      sessionService.revokeRefreshToken.mockResolvedValue(undefined);

      // Act
      await service.logout(refreshToken);

      // Assert
      expect(sessionService.revokeRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(logger.log).toHaveBeenCalledWith('User logged out', 'AuthService');
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto = {
      email: 'test@example.com',
    };

    it('should create reset token and send email for valid user', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      sessionService.createPasswordResetToken.mockResolvedValue('reset-token-123');

      // Act
      await service.forgotPassword(forgotPasswordDto);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: forgotPasswordDto.email },
      });
      expect(sessionService.createPasswordResetToken).toHaveBeenCalledWith(mockUser.id);
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.name,
        'reset-token-123'
      );
    });

    it('should NOT reveal if email does not exist (security)', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act
      await service.forgotPassword(forgotPasswordDto);

      // Assert - Should complete successfully without error
      expect(sessionService.createPasswordResetToken).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should NEVER log password reset tokens (security fix)', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      sessionService.createPasswordResetToken.mockResolvedValue('secret-reset-token');

      // Act
      await service.forgotPassword(forgotPasswordDto);

      // Assert - Verify token is NOT in any log calls
      expect(logger.log).toHaveBeenCalledWith(
        `Password reset requested for user: ${mockUser.id}`,
        'AuthService'
      );
      // Ensure the secret token was never passed to logger
      expect(logger.log).not.toHaveBeenCalledWith(
        expect.stringContaining('secret-reset-token'),
        expect.anything()
      );
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto = {
      token: 'valid-reset-token',
      newPassword: 'NewSecurePassword123!',
    };

    it('should successfully reset password with valid token', async () => {
      // Arrange
      sessionService.validatePasswordResetToken.mockResolvedValue(mockUser.id);
      prisma.user.update.mockResolvedValue(mockUser as any);
      sessionService.revokeAllUserSessions.mockResolvedValue(undefined);

      // Act
      await service.resetPassword(resetPasswordDto);

      // Assert
      expect(sessionService.validatePasswordResetToken).toHaveBeenCalledWith(
        resetPasswordDto.token
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { passwordHash: expect.any(String) },
      });
      expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(mockUser.id);
    });

    it('should hash new password with Argon2id', async () => {
      // Arrange
      sessionService.validatePasswordResetToken.mockResolvedValue(mockUser.id);
      const hashSpy = jest.spyOn(argon2, 'hash');
      prisma.user.update.mockResolvedValue(mockUser as any);
      sessionService.revokeAllUserSessions.mockResolvedValue(undefined);

      // Act
      await service.resetPassword(resetPasswordDto);

      // Assert
      expect(hashSpy).toHaveBeenCalledWith(resetPasswordDto.newPassword, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });
    });

    it('should throw BadRequestException for invalid token', async () => {
      // Arrange
      sessionService.validatePasswordResetToken.mockResolvedValue(null);

      // Act & Assert
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Invalid or expired reset token'
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should revoke all user sessions after password reset', async () => {
      // Arrange
      sessionService.validatePasswordResetToken.mockResolvedValue(mockUser.id);
      prisma.user.update.mockResolvedValue(mockUser as any);
      sessionService.revokeAllUserSessions.mockResolvedValue(undefined);

      // Act
      await service.resetPassword(resetPasswordDto);

      // Assert
      expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('validateUser', () => {
    it('should return user (without password) for valid credentials', async () => {
      // Arrange
      const userWithPassword = { ...mockUser, passwordHash: 'hashed' };
      prisma.user.findUnique.mockResolvedValue(userWithPassword as any);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);

      // Act
      const result = await service.validateUser(mockUser.email, 'password');

      // Assert
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });

    it('should return null for non-existent user', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.validateUser('nonexistent@example.com', 'password');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      prisma.user.findUnique.mockResolvedValue(inactiveUser as any);

      // Act
      const result = await service.validateUser(mockUser.email, 'password');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for invalid password', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      // Act
      const result = await service.validateUser(mockUser.email, 'wrong-password');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('generateTokens', () => {
    it('should generate access token with correct payload', async () => {
      // Arrange
      jwtService.sign.mockReturnValue('generated-token');
      sessionService.createRefreshToken.mockResolvedValue('refresh-token');

      // Act
      const result = await (service as any).generateTokens(mockUser.id, mockUser.email);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        iat: expect.any(Number),
        exp: expect.any(Number),
      });
    });

    it('should set access token expiration to 15 minutes', async () => {
      // Arrange
      jwtService.sign.mockImplementation((payload) => {
        const exp = payload.exp;
        const iat = payload.iat;
        expect(exp - iat).toBe(15 * 60); // 15 minutes in seconds
        return 'token';
      });
      sessionService.createRefreshToken.mockResolvedValue('refresh');

      // Act
      await (service as any).generateTokens(mockUser.id, mockUser.email);

      // Assert
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should return tokens with expiresIn', async () => {
      // Arrange
      jwtService.sign.mockReturnValue('access-token');
      sessionService.createRefreshToken.mockResolvedValue('refresh-token');

      // Act
      const result = await (service as any).generateTokens(mockUser.id, mockUser.email);

      // Assert
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900, // 15 * 60 seconds
      });
    });
  });
});
