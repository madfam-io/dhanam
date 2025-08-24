import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

export class TestDatabase {
  private static prisma: PrismaClient;

  static async setup(): Promise<PrismaClient> {
    if (!this.prisma) {
      // Generate a unique database name for this test run
      const dbName = `dhanam_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const testDatabaseUrl = process.env.DATABASE_URL?.replace(/\/[^/]+$/, `/${dbName}`) || 
        `postgresql://dhanam_test:test_password@localhost:5433/${dbName}`;

      // Create the test database
      const rootUrl = testDatabaseUrl.replace(/\/[^/]+$/, '/postgres');
      
      try {
        // Connect to postgres database to create test database
        const rootPrisma = new PrismaClient({
          datasources: { db: { url: rootUrl } },
        });
        
        await rootPrisma.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
        await rootPrisma.$disconnect();
      } catch (error) {
        console.warn('Database creation failed (may already exist):', error);
      }

      // Connect to the test database
      this.prisma = new PrismaClient({
        datasources: { db: { url: testDatabaseUrl } },
      });

      // Run migrations
      process.env.DATABASE_URL = testDatabaseUrl;
      try {
        execSync('pnpm prisma db push --force-reset', { 
          stdio: 'inherit',
          cwd: process.cwd(),
        });
      } catch (error) {
        console.error('Migration failed:', error);
        throw error;
      }

      // Seed test data if needed
      await this.seedTestData();
    }

    return this.prisma;
  }

  static async cleanup(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }

  static async cleanDatabase(): Promise<void> {
    if (this.prisma) {
      // Clean in order to respect foreign key constraints
      await this.prisma.transaction.deleteMany();
      await this.prisma.category.deleteMany();
      await this.prisma.budget.deleteMany();
      await this.prisma.account.deleteMany();
      await this.prisma.assetValuation.deleteMany();
      await this.prisma.userSpace.deleteMany();
      await this.prisma.space.deleteMany();
      await this.prisma.providerConnection.deleteMany();
      await this.prisma.user.deleteMany();
    }
  }

  private static async seedTestData(): Promise<void> {
    // Add any common test data that all tests might need
    // This could include default categories, test users, etc.
    
    // For now, we'll keep it minimal and let individual tests create what they need
    console.log('Test database seeded');
  }

  static async createTestUser() {
    const { hash } = await import('argon2');
    
    return this.prisma.user.create({
      data: {
        email: `test.${Date.now()}@example.com`,
        passwordHash: await hash('TestPassword123!'),
        name: 'Test User',
        locale: 'en',
        timezone: 'UTC',
      },
    });
  }

  static async createTestSpace(userId: string) {
    return this.prisma.space.create({
      data: {
        name: 'Test Space',
        type: 'personal',
        currency: 'USD',
        timezone: 'UTC',
        userSpaces: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
    });
  }

  static async createTestAccount(spaceId: string) {
    return this.prisma.account.create({
      data: {
        spaceId,
        provider: 'manual',
        providerAccountId: `manual_${Date.now()}`,
        name: 'Test Account',
        type: 'checking',
        subtype: 'checking',
        currency: 'USD',
        balance: 1000,
        lastSyncedAt: new Date(),
      },
    });
  }

  static async createTestBudget(spaceId: string) {
    return this.prisma.budget.create({
      data: {
        spaceId,
        name: 'Test Budget',
        period: 'monthly',
        currency: 'USD',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      },
    });
  }

  static async createTestCategory(budgetId: string) {
    return this.prisma.category.create({
      data: {
        budgetId,
        name: 'Test Category',
        type: 'expense',
        limit: 500,
        spent: 250,
        currency: 'USD',
        period: 'monthly',
      },
    });
  }
}