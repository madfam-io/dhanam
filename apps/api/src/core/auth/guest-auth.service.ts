import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../prisma/prisma.service';

import { DemoAuthService } from './demo-auth.service';

@Injectable()
export class GuestAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => DemoAuthService))
    private demoAuthService: DemoAuthService
  ) {}

  /**
   * Create a guest session with limited read-only access.
   * Delegates to DemoAuthService for the 'guest' persona so guests
   * get the same enriched data as persona-based demo users.
   */
  async createGuestSession(countryCode?: string): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const result = await this.demoAuthService.loginAsPersona('guest', countryCode);
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    };
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
