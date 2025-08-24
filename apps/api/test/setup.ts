// Global test setup
import 'reflect-metadata';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret-key-very-long-string';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '30d';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test utilities
declare global {
  var testUtils: any;
}

global.testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    locale: 'en',
    timezone: 'UTC',
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: null,
    emailVerificationToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    totpSecret: null,
    totpEnabled: false,
  }),

  createMockSpace: () => ({
    id: 'test-space-id',
    name: 'Test Space',
    type: 'personal',
    currency: 'USD',
    timezone: 'UTC',
    createdAt: new Date(),
    updatedAt: new Date(),
  }),

  createMockAccount: () => ({
    id: 'test-account-id',
    spaceId: 'test-space-id',
    provider: 'manual',
    providerAccountId: 'manual-test',
    name: 'Test Account',
    type: 'checking',
    subtype: 'checking',
    currency: 'USD',
    balance: 1000,
    lastSyncedAt: new Date(),
    isActive: true,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
};

// Cleanup function
afterAll(async () => {
  // Clean up any test resources
  jest.clearAllMocks();
});