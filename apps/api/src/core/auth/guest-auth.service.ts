import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { User } from '@db';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuestAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  /**
   * Create a guest session with limited read-only access
   * Guest sessions are temporary and expire after 1 hour
   */
  async createGuestSession(): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    // Get or create guest user
    const guestUser = await this.getOrCreateGuestUser();

    // Create limited JWT tokens for guest
    const payload = {
      sub: guestUser.id,
      email: guestUser.email,
      isGuest: true,
      permissions: ['read'], // Read-only access
    };

    // Shorter expiration for guest sessions
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h', // 1 hour for guest access
    });

    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '2h', // 2 hours max for guest
      }
    );

    // Log guest session creation
    await this.prisma.auditLog.create({
      data: {
        userId: guestUser.id,
        action: 'guest.session_created',
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
        }),
        ipAddress: 'guest',
        userAgent: 'guest-access',
      },
    });

    return {
      user: guestUser,
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    };
  }

  /**
   * Get or create the guest user
   */
  private async getOrCreateGuestUser(): Promise<User> {
    const guestEmail = 'guest@dhanam.demo';

    // Check if guest user already exists
    let guestUser = await this.prisma.user.findUnique({
      where: { email: guestEmail },
    });

    if (!guestUser) {
      // Create guest user
      guestUser = await this.prisma.user.create({
        data: {
          email: guestEmail,
          passwordHash: 'GUEST_NO_PASSWORD', // Guest users don't need passwords
          name: 'Guest User',
          locale: 'en',
          timezone: 'America/Mexico_City',
          emailVerified: true,
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
        },
      });

      // Create demo space for guest
      await this.createGuestDemoSpace(guestUser.id);
    }

    return guestUser;
  }

  /**
   * Create demo space with minimal data for guest users
   */
  private async createGuestDemoSpace(userId: string) {
    const space = await this.prisma.space.create({
      data: {
        name: 'Demo Personal Finance',
        type: 'personal',
        currency: 'MXN',
        timezone: 'America/Mexico_City',
        userSpaces: {
          create: {
            userId: userId,
            role: 'viewer', // Guest has read-only viewer role
          },
        },
      },
    });

    return space;
  }

  /**
   * Validate if a JWT token is for a guest session
   */
  async isGuestSession(token: string): Promise<boolean> {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded.isGuest === true;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup expired guest sessions
   */
  async cleanupExpiredGuestSessions(): Promise<void> {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await this.prisma.auditLog.deleteMany({
      where: {
        action: 'guest.session_created',
        createdAt: {
          lt: twoDaysAgo,
        },
      },
    });
  }
}
