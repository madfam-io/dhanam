import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import Redis from 'ioredis';
import { LoggerService } from '@core/logger/logger.service';

export interface SessionData {
  userId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

@Injectable()
export class SessionService {
  private redis: Redis;

  constructor(private logger: LoggerService) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      retryDelayOnFailover: 100,
    });
  }

  async createRefreshToken(userId: string, email: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(token);
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    const sessionData: SessionData = {
      userId,
      email,
      createdAt: Date.now(),
      expiresAt,
    };

    // Store in Redis with expiration
    await this.redis.setex(
      `refresh_token:${hashedToken}`,
      30 * 24 * 60 * 60, // 30 days in seconds
      JSON.stringify(sessionData),
    );

    // Track user's active sessions
    await this.redis.sadd(`user_sessions:${userId}`, hashedToken);
    await this.redis.expire(`user_sessions:${userId}`, 30 * 24 * 60 * 60);

    this.logger.log(`Refresh token created for user: ${userId}`, 'SessionService');

    return token;
  }

  async validateRefreshToken(token: string): Promise<SessionData | null> {
    const hashedToken = this.hashToken(token);
    const sessionDataStr = await this.redis.get(`refresh_token:${hashedToken}`);

    if (!sessionDataStr) {
      return null;
    }

    try {
      const sessionData: SessionData = JSON.parse(sessionDataStr);
      
      // Check if token is expired
      if (Date.now() > sessionData.expiresAt) {
        await this.revokeRefreshToken(token);
        return null;
      }

      return sessionData;
    } catch (error) {
      this.logger.error('Failed to parse session data', error as Error, 'SessionService');
      await this.revokeRefreshToken(token);
      return null;
    }
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);
    
    // Get session data to remove from user's active sessions
    const sessionDataStr = await this.redis.get(`refresh_token:${hashedToken}`);
    if (sessionDataStr) {
      try {
        const sessionData: SessionData = JSON.parse(sessionDataStr);
        await this.redis.srem(`user_sessions:${sessionData.userId}`, hashedToken);
      } catch (error) {
        this.logger.error('Failed to parse session data during revocation', error as Error, 'SessionService');
      }
    }

    await this.redis.del(`refresh_token:${hashedToken}`);
    this.logger.log('Refresh token revoked', 'SessionService');
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const hashedTokens = await this.redis.smembers(`user_sessions:${userId}`);
    
    const pipeline = this.redis.pipeline();
    
    // Remove all refresh tokens
    for (const hashedToken of hashedTokens) {
      pipeline.del(`refresh_token:${hashedToken}`);
    }
    
    // Remove user sessions set
    pipeline.del(`user_sessions:${userId}`);
    
    await pipeline.exec();

    this.logger.log(`All sessions revoked for user: ${userId}`, 'SessionService');
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(token);
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    // Store reset token
    await this.redis.setex(
      `password_reset:${hashedToken}`,
      60 * 60, // 1 hour in seconds
      JSON.stringify({ userId, expiresAt }),
    );

    this.logger.log(`Password reset token created for user: ${userId}`, 'SessionService');

    return token;
  }

  async validatePasswordResetToken(token: string): Promise<string | null> {
    const hashedToken = this.hashToken(token);
    const resetDataStr = await this.redis.get(`password_reset:${hashedToken}`);

    if (!resetDataStr) {
      return null;
    }

    try {
      const resetData = JSON.parse(resetDataStr);
      
      if (Date.now() > resetData.expiresAt) {
        await this.redis.del(`password_reset:${hashedToken}`);
        return null;
      }

      // Single-use token - delete after validation
      await this.redis.del(`password_reset:${hashedToken}`);

      return resetData.userId;
    } catch (error) {
      this.logger.error('Failed to parse reset token data', error as Error, 'SessionService');
      await this.redis.del(`password_reset:${hashedToken}`);
      return null;
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async onModuleDestroy() {
    await this.redis.disconnect();
  }
}