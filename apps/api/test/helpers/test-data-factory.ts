import { PrismaClient, User, Space, Account, Transaction, Budget, Category } from '@prisma/client';
import * as argon2 from 'argon2';

export class TestDataFactory {
  constructor(private prisma: PrismaClient) {}

  async createUser(overrides: Partial<User> = {}): Promise<User> {
    const passwordHash = await argon2.hash('TestPassword123!', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    return this.prisma.user.create({
      data: {
        email: overrides.email || `test${Date.now()}@example.com`,
        name: overrides.name || 'Test User',
        passwordHash,
        locale: overrides.locale || 'es',
        timezone: overrides.timezone || 'America/Mexico_City',
        emailVerified: overrides.emailVerified ?? true,
        isActive: overrides.isActive ?? true,
        onboardingCompleted: overrides.onboardingCompleted ?? true,
        ...overrides,
      },
    });
  }

  async createSpace(userId: string, overrides: Partial<Space> = {}): Promise<Space> {
    return this.prisma.space.create({
      data: {
        name: overrides.name || 'Test Space',
        type: overrides.type || 'personal',
        currency: overrides.currency || 'MXN',
        timezone: overrides.timezone || 'America/Mexico_City',
        userSpaces: {
          create: {
            userId,
            role: 'owner',
          },
        },
        ...overrides,
      },
    });
  }

  async createAccount(spaceId: string, overrides: Partial<Account> = {}): Promise<Account> {
    return this.prisma.account.create({
      data: {
        spaceId,
        provider: overrides.provider || 'manual',
        name: overrides.name || 'Test Account',
        type: overrides.type || 'checking',
        currency: overrides.currency || 'MXN',
        balance: overrides.balance || 1000,
        ...overrides,
      },
    });
  }

  async createTransaction(accountId: string, overrides: Partial<Transaction> = {}): Promise<Transaction> {
    return this.prisma.transaction.create({
      data: {
        accountId,
        amount: overrides.amount || -100,
        currency: overrides.currency || 'MXN',
        description: overrides.description || 'Test Transaction',
        date: overrides.date || new Date(),
        pending: overrides.pending ?? false,
        ...overrides,
      },
    });
  }

  async createBudget(spaceId: string, overrides: Partial<Budget> = {}): Promise<Budget> {
    return this.prisma.budget.create({
      data: {
        spaceId,
        name: overrides.name || 'Test Budget',
        period: overrides.period || 'monthly',
        startDate: overrides.startDate || new Date(),
        ...overrides,
      },
    });
  }

  async createCategory(budgetId: string, overrides: Partial<Category> = {}): Promise<Category> {
    return this.prisma.category.create({
      data: {
        budgetId,
        name: overrides.name || 'Test Category',
        budgetedAmount: overrides.budgetedAmount || 1000,
        ...overrides,
      },
    });
  }

  async createFullSetup() {
    const user = await this.createUser();
    const space = await this.createSpace(user.id);
    const account = await this.createAccount(space.id);
    const budget = await this.createBudget(space.id);
    const category = await this.createCategory(budget.id);
    const transaction = await this.createTransaction(account.id, {
      categoryId: category.id,
    });

    return { user, space, account, budget, category, transaction };
  }
}
