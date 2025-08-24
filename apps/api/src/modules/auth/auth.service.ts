import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@core/prisma/prisma.service';
import { CryptoService } from '@core/crypto/crypto.service';
import { RedisService } from '@core/redis/redis.service';
import { LoggerService } from '@core/logger/logger.service';

import { TokenService } from './services/token.service';
import { TwoFactorService } from './services/two-factor.service';
import { LoginDto, RegisterDto } from './dto';
import { AuthResponse, TwoFactorSetupResponse } from '@dhanam/shared';

interface AuthContext {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
    private tokenService: TokenService,
    private twoFactorService: TwoFactorService,
    private redis: RedisService,
    private logger: LoggerService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, context: AuthContext): Promise<AuthResponse> {
    try {
      const passwordHash = await this.crypto.hashPassword(dto.password);

      const user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          name: dto.name,
          locale: dto.locale || 'es',
          timezone: dto.timezone || 'America/Mexico_City',
        },
      });

      this.logger.log(`User registered: ${user.email}`, 'AuthService');

      const tokens = await this.tokenService.generateAuthTokens(user);

      await this.createAuditLog(user.id, 'user.registered', context);

      return {
        user: this.sanitizeUser(user),
        tokens,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email already exists');
        }
      }
      throw error;
    }
  }

  async login(dto: LoginDto, context: AuthContext): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        userSpaces: {
          include: {
            space: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.crypto.verifyPassword(
      user.passwordHash,
      dto.password,
    );

    if (!isPasswordValid) {
      await this.handleFailedLogin(user.email, context);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.totpEnabled && !dto.totpCode) {
      throw new UnauthorizedException('2FA code required');
    }

    if (user.totpEnabled && dto.totpCode) {
      const isValid = this.twoFactorService.verifyTotp(
        user.totpSecret!,
        dto.totpCode,
      );
      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    const tokens = await this.tokenService.generateAuthTokens(user);

    await this.createAuditLog(user.id, 'user.login', context);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async refresh(refreshToken: string, context: AuthContext): Promise<AuthResponse> {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    
    const session = await this.prisma.session.findUnique({
      where: { tokenFamily: payload.family },
      include: {
        user: {
          include: {
            userSpaces: {
              include: {
                space: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await this.crypto.verifyPassword(
      session.refreshTokenHash,
      refreshToken,
    );

    if (!isValid) {
      await this.handleSuspiciousRefresh(session.userId, payload.family);
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const tokens = await this.tokenService.rotateRefreshToken(
      session.user,
      payload.family,
    );

    await this.createAuditLog(session.userId, 'token.refreshed', context);

    return {
      user: this.sanitizeUser(session.user),
      tokens,
    };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      
      await this.prisma.session.delete({
        where: { tokenFamily: payload.family },
      });

      await this.redis.del(`blacklist:${payload.jti}`);
      
      this.logger.log(`User logged out: ${userId}`, 'AuthService');
    } catch (error) {
      this.logger.warn(`Logout failed for user ${userId}: ${error.message}`, 'AuthService');
    }
  }

  async setupTwoFactor(userId: string): Promise<TwoFactorSetupResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.totpEnabled) {
      throw new BadRequestException('2FA already enabled');
    }

    const { secret, qrCode } = this.twoFactorService.generateSecret(
      user.email,
    );

    await this.redis.set(
      `2fa:setup:${userId}`,
      secret,
      300, // 5 minutes
    );

    return { secret, qrCode };
  }

  async verifyAndEnableTwoFactor(userId: string, code: string): Promise<void> {
    const tempSecret = await this.redis.get(`2fa:setup:${userId}`);
    
    if (!tempSecret) {
      throw new BadRequestException('2FA setup expired');
    }

    const isValid = this.twoFactorService.verifyTotp(tempSecret, code);
    
    if (!isValid) {
      throw new BadRequestException('Invalid code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: tempSecret,
        totpEnabled: true,
      },
    });

    await this.redis.del(`2fa:setup:${userId}`);
    
    this.logger.log(`2FA enabled for user: ${userId}`, 'AuthService');
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const isPasswordValid = await this.crypto.verifyPassword(
      user.passwordHash,
      currentPassword,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid current password');
    }

    const passwordHash = await this.crypto.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.prisma.session.deleteMany({
      where: { userId },
    });

    this.logger.log(`Password changed for user: ${userId}`, 'AuthService');
  }

  private async handleFailedLogin(email: string, context: AuthContext): Promise<void> {
    const key = `failed:login:${email}`;
    const attempts = await this.redis.incr(key);
    
    if (attempts === 1) {
      await this.redis.expire(key, 900); // 15 minutes
    }

    if (attempts >= 5) {
      this.logger.warn(
        `Multiple failed login attempts for ${email} from ${context.ipAddress}`,
        'AuthService',
      );
    }
  }

  private async handleSuspiciousRefresh(userId: string, tokenFamily: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { tokenFamily },
    });

    this.logger.warn(
      `Suspicious refresh token use detected for user ${userId}`,
      'AuthService',
    );

    await this.createAuditLog(userId, 'security.suspicious_refresh', {});
  }

  private async createAuditLog(
    userId: string,
    action: string,
    context: AuthContext,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType: 'auth',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });
  }

  private sanitizeUser(user: any): any {
    const { passwordHash, totpSecret, ...sanitized } = user;
    return sanitized;
  }
}