import { test as base, expect, Page } from '@playwright/test';
import { adminLogin, adminLogout } from './auth';

/**
 * Extended test fixtures with admin authentication helpers.
 */
export const test = base.extend<{
  adminPage: Page;
}>({
  /**
   * A Page pre-authenticated as an admin user and navigated to /dashboard.
   */
  adminPage: async ({ page }, use) => {
    await page.goto('/');
    await adminLogin(page);
    await page.goto('/dashboard');
    await use(page);
    await adminLogout(page);
  },
});

export { expect };
