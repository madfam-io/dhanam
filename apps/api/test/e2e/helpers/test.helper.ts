import { PrismaService } from '../../../src/core/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'argon2';
import { User, Space, Account, Budget, Category, ProviderConnection } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  locale?: string;
  timezone?: string;
  emailVerified?: boolean;
}

export interface CreateSpaceData {
  name: string;
  type: 'personal' | 'business';
  currency: string;
  timezone?: string;
}

export interface CreateAccountData {
  provider: string;
  providerAccountId: string;
  name: string;
  type: string;
  subtype: string;
  currency: string;
  balance: number;
}

export interface CreateBudgetData {
  name: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  income?: number;
}

export class TestHelper {
  private configService: ConfigService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.configService = new ConfigService();
  }

  async cleanDatabase(): Promise<void> {
    // Clean in order to respect foreign key constraints
    await this.prisma.$transaction([
      this.prisma.transaction.deleteMany(),
      this.prisma.category.deleteMany(),
      this.prisma.budget.deleteMany(),
      this.prisma.account.deleteMany(),
      this.prisma.assetValuation.deleteMany(),
      this.prisma.userSpace.deleteMany(),
      this.prisma.space.deleteMany(),
      this.prisma.providerConnection.deleteMany(),
      this.prisma.userPreferences.deleteMany(),
      this.prisma.auditLog.deleteMany(),
      this.prisma.user.deleteMany(),
    ]);
  }

  async createUser(data: CreateUserData): Promise<User> {
    const passwordHash = await hash(data.password);
    
    return await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        locale: data.locale || 'es',
        timezone: data.timezone || 'America/Mexico_City',
        emailVerified: data.emailVerified || false,
        onboardingStep: 'welcome',
        onboardingCompleted: false,
      },
    });
  }

  async createSpace(userId: string, data: CreateSpaceData): Promise<Space> {
    return await this.prisma.space.create({
      data: {
        name: data.name,
        type: data.type,
        currency: data.currency,
        timezone: data.timezone || 'UTC',
        userSpaces: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
    });
  }

  async createAccount(spaceId: string, data: CreateAccountData): Promise<Account> {
    return await this.prisma.account.create({
      data: {
        spaceId,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        name: data.name,
        type: data.type,
        subtype: data.subtype,
        currency: data.currency,
        balance: data.balance,
        lastSyncedAt: new Date(),
        isActive: true,
      },
    });
  }

  async createBudget(spaceId: string, data: CreateBudgetData): Promise<Budget> {
    return await this.prisma.budget.create({
      data: {
        spaceId,
        name: data.name,
        period: data.period,
        startDate: data.startDate,
        endDate: data.endDate,
        income: data.income || 0,
      },
    });
  }

  async createCategory(budgetId: string, data: {
    name: string;
    budgetedAmount: number;
    icon?: string;
    color?: string;
    description?: string;
  }): Promise<Category> {
    return await this.prisma.category.create({
      data: {
        budgetId,
        name: data.name,
        budgetedAmount: data.budgetedAmount,
        icon: data.icon || 'default',
        color: data.color || '#000000',
        description: data.description,
      },
    });
  }

  async createProviderConnection(userId: string, data: {
    provider: 'belvo' | 'plaid' | 'bitso';
    encryptedAccessToken: string;
    metadata?: any;
  }): Promise<ProviderConnection> {
    return await this.prisma.providerConnection.create({
      data: {
        userId,
        provider: data.provider,
        encryptedAccessToken: data.encryptedAccessToken,
        lastSyncedAt: new Date(),
        status: 'active',
        metadata: data.metadata || {},
      },
    });
  }

  generateAuthToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET') || 'test-jwt-secret-key-very-long-string',
      expiresIn: '15m',
    });
  }

  generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET') || 'test-jwt-secret-key-very-long-string',
      expiresIn: '30d',
    });
  }

  async createCompleteUserWithSpace(data: {
    email: string;
    password: string;
    name: string;
    spaceName?: string;
  }): Promise<{
    user: User;
    space: Space;
    authToken: string;
  }> {
    const user = await this.createUser(data);
    const space = await this.createSpace(user.id, {
      name: data.spaceName || 'Personal Space',
      type: 'personal',
      currency: 'MXN',
    });
    const authToken = this.generateAuthToken(user);

    return { user, space, authToken };
  }

  async createMockTransaction(accountId: string, data: {
    amount: number;
    description: string;
    date?: Date;
    categoryId?: string;
    merchant?: string;
  }) {
    return await this.prisma.transaction.create({
      data: {
        accountId,
        amount: data.amount,
        description: data.description,
        date: data.date || new Date(),
        pending: false,
        categoryId: data.categoryId,
        currency: 'MXN',
        merchant: data.merchant || data.description,
      },
    });
  }

  async verifyUserEmail(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  }

  async createUserPreferences(userId: string, preferences: any) {
    return await this.prisma.userPreferences.create({
      data: {
        userId,
        ...preferences,
      },
    });
  }

  async simulateProviderWebhook(provider: string, event: string, data: any) {
    // This would simulate webhook calls from providers
    // In real tests, you might want to actually call the webhook endpoints
    return {
      provider,
      event,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  async waitForCondition(
    condition: () => Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100,
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error('Condition not met within timeout');
  }

  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    limit?: number;
  }) {
    return await this.prisma.auditLog.findMany({
      where: {
        userId: filters.userId,
        action: filters.action,
        entityType: filters.entityType,
      },
      take: filters.limit || 10,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTestDataForAnalytics(userId: string, spaceId: string) {
    // Create multiple accounts
    const checkingAccount = await this.createAccount(spaceId, {
      provider: 'manual',
      providerAccountId: 'manual-checking',
      name: 'Test Checking',
      type: 'depository',
      subtype: 'checking',
      currency: 'MXN',
      balance: 10000,
    });

    const savingsAccount = await this.createAccount(spaceId, {
      provider: 'manual',
      providerAccountId: 'manual-savings',
      name: 'Test Savings',
      type: 'depository',
      subtype: 'savings',
      currency: 'MXN',
      balance: 50000,
    });

    // Create budget with categories
    const budget = await this.createBudget(spaceId, {
      name: 'Monthly Budget',
      period: 'monthly',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    });

    const foodCategory = await this.createCategory(budget.id, {
      name: 'Food & Dining',
      budgetedAmount: 5000,
    });

    const transportCategory = await this.createCategory(budget.id, {
      name: 'Transportation',
      budgetedAmount: 3000,
    });

    // Create transactions
    await this.createMockTransaction(checkingAccount.id, {
      amount: -250,
      description: 'Restaurant ABC',
      categoryId: foodCategory.id,
    });

    await this.createMockTransaction(checkingAccount.id, {
      amount: -150,
      description: 'Uber ride',
      categoryId: transportCategory.id,
    });

    await this.createMockTransaction(checkingAccount.id, {
      amount: 5000,
      description: 'Salary deposit',
    });

    return {
      checkingAccount,
      savingsAccount,
      budget,
      categories: { foodCategory, transportCategory },
    };
  }
}