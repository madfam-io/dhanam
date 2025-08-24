import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000';
process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-posthog-key';

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    locale: 'en',
    timezone: 'UTC',
  }),
  
  createMockSpace: () => ({
    id: 'test-space',
    name: 'Test Space',
    type: 'personal',
    currency: 'USD',
    timezone: 'UTC',
  }),
  
  createMockAccount: () => ({
    id: 'test-account',
    name: 'Test Account',
    type: 'checking',
    provider: 'manual',
    currency: 'USD',
    balance: 1000,
    lastSyncedAt: new Date().toISOString(),
  }),
  
  createMockTransaction: () => ({
    id: 'test-transaction',
    accountId: 'test-account',
    amount: -50,
    currency: 'USD',
    description: 'Test Transaction',
    date: new Date().toISOString(),
  }),
};

// Silence console warnings in tests
const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || args[0].includes('ReactDOM.render'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};