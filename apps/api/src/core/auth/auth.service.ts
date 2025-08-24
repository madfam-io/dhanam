import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '@core/prisma/prisma.service';
import { LoggerService } from '@core/logger/logger.service';
import { SessionService } from './session.service';
import { TotpService } from './totp.service';
import {
  LoginDto,
  RegisterDto,
  AuthTokens,
  RefreshTokenDto,
  ResetPasswordDto,
  ForgotPasswordDto,
} from '@dhanam/shared';

export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private logger: LoggerService,
    private sessionService: SessionService,
    private totpService: TotpService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash password with Argon2id
    const hashedPassword = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash: hashedPassword,
        locale: dto.locale || 'es',
        timezone: dto.timezone || 'America/Mexico_City',
      },
    });

    // Create default personal space
    await this.prisma.space.create({
      data: {
        name: `${dto.name}'s Personal`,
        type: 'personal',
        currency: 'MXN',
        timezone: user.timezone,
        userSpaces: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
      },
    });

    this.logger.log(`User registered: ${user.email}`, 'AuthService');

    return this.generateTokens(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.validateUser(dto.email, dto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check TOTP if enabled
    if (user.totpSecret) {
      if (!dto.totpCode) {
        throw new UnauthorizedException('TOTP code required');
      }

      const isValidTotp = this.totpService.verifyToken(
        user.totpSecret,
        dto.totpCode,
      );

      if (!isValidTotp) {
        throw new UnauthorizedException('Invalid TOTP code');
      }
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`User logged in: ${user.email}`, 'AuthService');

    return this.generateTokens(user.id, user.email);
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<AuthTokens> {
    const sessionData = await this.sessionService.validateRefreshToken(
      dto.refreshToken,
    );

    if (!sessionData) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Invalidate old refresh token
    await this.sessionService.revokeRefreshToken(dto.refreshToken);

    // Generate new tokens
    return this.generateTokens(sessionData.userId, sessionData.email);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessionService.revokeRefreshToken(refreshToken);
    this.logger.log('User logged out', 'AuthService');
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Don't reveal if email exists
      return;
    }

    const resetToken = await this.sessionService.createPasswordResetToken(
      user.id,
    );

    // TODO: Send email with reset link
    // For now, log the token (remove in production)
    this.logger.log(
      `Password reset token for ${user.email}: ${resetToken}`,
      'AuthService',
    );
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const userId = await this.sessionService.validatePasswordResetToken(
      dto.token,
    );

    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    // Revoke all sessions for this user
    await this.sessionService.revokeAllUserSessions(userId);

    this.logger.log(`Password reset for user: ${userId}`, 'AuthService');
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        totpSecret: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await argon2.verify(user.passwordHash, password);
    
    if (!isValidPassword) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  private async generateTokens(userId: string, email: string): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.sessionService.createRefreshToken(
      userId,
      email,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }
}