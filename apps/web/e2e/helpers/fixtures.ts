import { test as base, expect, Page } from '@playwright/test';
import { loginAsGuest, loginWithCredentials, logout } from './auth';

/**
 * Extended test fixtures with authentication helpers
 */
export const test = base.extend<{
  authenticatedPage: Page;
  guestPage: Page;
}>({
  /**
   * Page pre-authenticated as a guest demo user
   */
  guestPage: async ({ page }, use) => {
    await page.goto('/');
    await loginAsGuest(page);
    await page.goto('/dashboard');
    await use(page);
    await logout(page);
  },

  /**
   * Page pre-authenticated with test credentials
   */
  authenticatedPage: async ({ page }, use) => {
    const email = process.env.E2E_TEST_EMAIL || 'test@dhanam.demo';
    const password = process.env.E2E_TEST_PASSWORD || 'TestPassword123!';

    await page.goto('/');
    try {
      await loginWithCredentials(page, email, password);
      await page.goto('/dashboard');
    } catch {
      // Fallback to guest login if credentials don't work
      await loginAsGuest(page);
      await page.goto('/dashboard');
    }

    await use(page);
    await logout(page);
  },
});

export { expect };

/**
 * Test data constants
 */
export const TEST_DATA = {
  validUser: {
    email: 'e2e-test@example.com',
    password: 'E2eTestPassword123!',
    name: 'E2E Test User',
  },
  demoUser: {
    email: 'guest@dhanam.demo',
    name: 'Demo User',
  },
  spaces: {
    personal: {
      name: 'Personal',
      currency: 'USD',
    },
  },
};
