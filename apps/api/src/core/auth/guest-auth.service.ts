import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class GuestAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
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
    // Check if guest access is enabled
    const guestEnabled = this.configService.get<boolean>('ENABLE_GUEST_ACCESS', false);
    if (!guestEnabled) {
      throw new Error('Guest access is not enabled');
    }

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
      },
    );

    // Log guest session creation
    await this.prisma.auditLog.create({
      data: {
        userId: guestUser.id,
        action: 'guest.session_created',
        details: {
          timestamp: new Date().toISOString(),
        },
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
   * Get or create the shared guest user account
   * All guest sessions share the same read-only demo data
   */
  private async getOrCreateGuestUser(): Promise<User> {
    const GUEST_EMAIL = 'guest@dhanam.demo';

    // Try to find existing guest user
    let guestUser = await this.prisma.user.findUnique({
      where: { email: GUEST_EMAIL },
    });

    // Create guest user if it doesn't exist
    if (!guestUser) {
      guestUser = await this.prisma.user.create({
        data: {
          email: GUEST_EMAIL,
          passwordHash: 'GUEST_NO_PASSWORD', // Guest users don't use passwords
          name: 'Guest User',
          locale: 'es',
          timezone: 'America/Mexico_City',
          emailVerified: true,
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          preferences: {
            create: {
              emailNotifications: false,
              pushNotifications: false,
              dataSharing: false,
              analyticsTracking: false,
              defaultCurrency: 'MXN',
              dashboardLayout: 'demo',
              showBalances: true,
              esgScoreVisibility: true,
            },
          },
        },
      });

      // Create demo space for guest
      await this.createGuestDemoSpace(guestUser.id);
    }

    return guestUser;
  }

  /**
   * Create demo space with sample data for guest users
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

    // Create sample accounts
    const accounts = await Promise.all([
      this.prisma.account.create({
        data: {
          spaceId: space.id,
          provider: 'manual',
          providerAccountId: 'guest-checking',
          name: 'BBVA Checking',
          type: 'checking',
          subtype: 'checking',
          currency: 'MXN',
          balance: 45320.50,
          lastSyncedAt: new Date(),
        },
      }),
      this.prisma.account.create({
        data: {
          spaceId: space.id,
          provider: 'manual',
          providerAccountId: 'guest-savings',
          name: 'Santander Savings',
          type: 'savings',
          subtype: 'savings',
          currency: 'MXN',
          balance: 125000,
          lastSyncedAt: new Date(),
        },
      }),
      this.prisma.account.create({
        data: {
          spaceId: space.id,
          provider: 'manual',
          providerAccountId: 'guest-credit',
          name: 'Banamex Credit Card',
          type: 'credit',
          subtype: 'credit_card',
          currency: 'MXN',
          balance: -8500,
          creditLimit: 50000,
          lastSyncedAt: new Date(),
        },
      }),
    ]);

    // Create sample budget
    const budget = await this.prisma.budget.create({
      data: {
        spaceId: space.id,
        name: 'Monthly Budget',
        period: 'monthly',
        amount: 65000,
        currency: 'MXN',
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        categories: {
          create: [
            { name: 'Rent', budgetAmount: 15000, color: '#FF6B6B', icon: '🏠' },
            { name: 'Groceries', budgetAmount: 6000, color: '#4ECDC4', icon: '🛒' },
            { name: 'Transportation', budgetAmount: 3000, color: '#45B7D1', icon: '🚗' },
            { name: 'Entertainment', budgetAmount: 4000, color: '#96CEB4', icon: '🎬' },
            { name: 'Savings', budgetAmount: 15000, color: '#FECA57', icon: '💰' },
          ],
        },
      },
    });

    // Create sample transactions
    const categories = await this.prisma.category.findMany({
      where: { budgetId: budget.id },
    });

    const checkingAccount = accounts[0];
    const transactionData = [
      { description: 'Oxxo', amount: -150, category: 'Groceries' },
      { description: 'Uber', amount: -120, category: 'Transportation' },
      { description: 'Netflix', amount: -169, category: 'Entertainment' },
      { description: 'Salary Deposit', amount: 35000, category: null },
      { description: 'Restaurant', amount: -850, category: 'Entertainment' },
      { description: 'Soriana', amount: -2300, category: 'Groceries' },
      { description: 'Gas Station', amount: -800, category: 'Transportation' },
    ];

    for (const txn of transactionData) {
      const category = txn.category
        ? categories.find((c) => c.name === txn.category)
        : null;

      await this.prisma.transaction.create({
        data: {
          accountId: checkingAccount.id,
          spaceId: space.id,
          categoryId: category?.id,
          amount: txn.amount,
          currency: 'MXN',
          description: txn.description,
          merchantName: txn.description,
          date: new Date(),
          pending: false,
        },
      });
    }

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
   * Clean up expired guest sessions (can be run as a cron job)
   */
  async cleanupExpiredGuestSessions(): Promise<void> {
    // Clean up old audit logs for guest sessions
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await this.prisma.auditLog.deleteMany({
      where: {
        user: {
          email: 'guest@dhanam.demo',
        },
        createdAt: {
          lt: twoDaysAgo,
        },
      },
    });
  }
}