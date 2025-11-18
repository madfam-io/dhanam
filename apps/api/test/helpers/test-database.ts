import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

/**
 * Test Database Helper
 *
 * Provides utilities for managing test database state:
 * - Setup: Reset schema and connect
 * - Cleanup: Clear all data between tests
 * - Teardown: Disconnect from database
 *
 * Usage:
 * beforeAll(() => TestDatabase.setup());
 * afterEach(() => TestDatabase.cleanup());
 * afterAll(() => TestDatabase.teardown());
 */
export class TestDatabase {
  private static prisma: PrismaClient;
  private static isSetup = false;

  /**
   * Setup test database
   * - Resets database schema using migrations
   * - Connects Prisma client
   * - Should be called once before all tests
   */
  static async setup(): Promise<void> {
    if (this.isSetup) {
      return;
    }

    // Ensure we're using test database
    if (!process.env.DATABASE_URL?.includes('test')) {
      throw new Error(
        'DATABASE_URL must contain "test" to prevent accidental deletion of production data'
      );
    }

    try {
      // Reset database using migrations (safer than db push)
      execSync('pnpm prisma migrate reset --force --skip-seed', {
        env: { ...process.env },
        stdio: 'ignore', // Suppress output in tests
      });
    } catch (error) {
      console.error('Failed to reset test database:', error);
      throw error;
    }

    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: [], // Disable logging in tests
    });

    await this.prisma.$connect();
    this.isSetup = true;
  }

  /**
   * Cleanup test data
   * - Deletes all records from all tables
   * - Maintains referential integrity (deletes in correct order)
   * - Should be called after each test
   */
  static async cleanup(): Promise<void> {
    if (!this.prisma) {
      throw new Error('TestDatabase not setup. Call setup() first.');
    }

    try {
      // Delete in order to respect foreign key constraints
      await this.prisma.$transaction([
        // Delete child records first
        this.prisma.transaction.deleteMany(),
        this.prisma.assetValuation.deleteMany(),
        this.prisma.eSGScore.deleteMany(),
        this.prisma.connection.deleteMany(),
        this.prisma.category.deleteMany(),
        this.prisma.transactionRule.deleteMany(),
        this.prisma.account.deleteMany(),
        this.prisma.budget.deleteMany(),
        this.prisma.userSpace.deleteMany(),
        this.prisma.space.deleteMany(),
        this.prisma.session.deleteMany(),
        this.prisma.providerConnection.deleteMany(),
        this.prisma.userPreferences.deleteMany(),
        this.prisma.auditLog.deleteMany(),
        this.prisma.webhookEvent.deleteMany(),
        this.prisma.errorLog.deleteMany(),
        this.prisma.exchangeRate.deleteMany(),

        // Delete parent records last
        this.prisma.user.deleteMany(),
      ]);
    } catch (error) {
      console.error('Failed to cleanup test database:', error);
      throw error;
    }
  }

  /**
   * Teardown test database
   * - Disconnects Prisma client
   * - Should be called once after all tests
   */
  static async teardown(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.isSetup = false;
    }
  }

  /**
   * Get Prisma client instance
   * - Use this to perform database operations in tests
   */
  static getClient(): PrismaClient {
    if (!this.prisma) {
      throw new Error('TestDatabase not setup. Call setup() first.');
    }
    return this.prisma;
  }

  /**
   * Execute raw SQL (use sparingly)
   * - Useful for complex queries or data setup
   */
  static async executeRaw(sql: string, ...params: any[]): Promise<any> {
    if (!this.prisma) {
      throw new Error('TestDatabase not setup. Call setup() first.');
    }
    return this.prisma.$executeRawUnsafe(sql, ...params);
  }

  /**
   * Query raw SQL (use sparingly)
   * - Useful for verification queries
   */
  static async queryRaw(sql: string, ...params: any[]): Promise<any> {
    if (!this.prisma) {
      throw new Error('TestDatabase not setup. Call setup() first.');
    }
    return this.prisma.$queryRawUnsafe(sql, ...params);
  }

  /**
   * Get count of records in a table
   * - Useful for asserting data was created/deleted
   */
  static async getCount(tableName: string): Promise<number> {
    const result = await this.queryRaw(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    );
    return parseInt(result[0].count, 10);
  }

  /**
   * Truncate all tables (faster than deleteMany)
   * - WARNING: Resets auto-increment counters
   * - Use cleanup() instead unless you need this behavior
   */
  static async truncateAll(): Promise<void> {
    if (!this.prisma) {
      throw new Error('TestDatabase not setup. Call setup() first.');
    }

    const tables = [
      'transactions',
      'asset_valuations',
      'esg_scores',
      'connections',
      'categories',
      'transaction_rules',
      'accounts',
      'budgets',
      'user_spaces',
      'spaces',
      'sessions',
      'provider_connections',
      'user_preferences',
      'audit_logs',
      'webhook_events',
      'error_logs',
      'exchange_rates',
      'users',
    ];

    for (const table of tables) {
      await this.executeRaw(`TRUNCATE TABLE "${table}" CASCADE`);
    }
  }
}
