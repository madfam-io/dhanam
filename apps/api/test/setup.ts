// Global test setup
import 'reflect-metadata';

// Mock environment variables for testing (only if not already set by CI)
process.env.NODE_ENV = 'test';
// Use development database for E2E tests (matches docker-compose.yml)
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://dhanam:localdev@localhost:5432/dhanam';
// Redis (no password for local development)
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
process.env.REDIS_DB = process.env.REDIS_DB || '0';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-very-long-string';
process.env.JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
process.env.JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-exactly-32!!'; // Must be exactly 32 chars
process.env.POSTHOG_API_KEY = process.env.POSTHOG_API_KEY || 'test-posthog-api-key';
process.env.POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://app.posthog.com';
process.env.SENTRY_DSN = process.env.SENTRY_DSN || '';
process.env.BELVO_SECRET_ID = process.env.BELVO_SECRET_ID || 'test-belvo-secret';
process.env.BELVO_SECRET_PASSWORD = process.env.BELVO_SECRET_PASSWORD || 'test-belvo-password';
process.env.PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || 'test-plaid-client';
process.env.PLAID_SECRET = process.env.PLAID_SECRET || 'test-plaid-secret';

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