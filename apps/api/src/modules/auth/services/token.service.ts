import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '@core/prisma/prisma.service';
import { CryptoService } from '@core/crypto/crypto.service';
import { RedisService } from '@core/redis/redis.service';
import { AuthTokens, JwtPayload } from '@dhanam/shared';

@Injectable()
export class TokenService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private crypto: CryptoService,
    private redis: RedisService,
    private configService: ConfigService,
  ) {}

  async generateAuthTokens(user: any): Promise<AuthTokens> {
    const tokenFamily = uuidv4();
    
    const spaces = user.userSpaces?.map((us: any) => ({
      id: us.space.id,
      role: us.role,
    })) || [];

    const accessTokenPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      spaces,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
      jti: uuidv4(),
    };

    const refreshTokenPayload = {
      sub: user.id,
      family: tokenFamily,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      jti: uuidv4(),
    };

    const accessToken = this.jwt.sign(accessTokenPayload);
    const refreshToken = this.jwt.sign(refreshTokenPayload, {
      expiresIn: this.configService.get('jwt.refreshExpiry'),
    });

    const refreshTokenHash = await this.crypto.hashPassword(refreshToken);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenFamily,
        refreshTokenHash,
        expiresAt: new Date(refreshTokenPayload.exp * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60,
    };
  }

  async rotateRefreshToken(user: any, tokenFamily: string): Promise<AuthTokens> {
    await this.prisma.session.delete({
      where: { tokenFamily },
    });

    return this.generateAuthTokens(user);
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwt.verify<JwtPayload>(token);
      
      const isBlacklisted = await this.redis.exists(`blacklist:${payload.jti}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async verifyRefreshToken(token: string): Promise<any> {
    try {
      return this.jwt.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async blacklistToken(jti: string, exp: number): Promise<void> {
    const ttl = exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await this.redis.set(`blacklist:${jti}`, '1', ttl);
    }
  }
}