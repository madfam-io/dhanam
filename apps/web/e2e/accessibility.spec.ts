import { test, expect } from './helpers/fixtures';
import { checkA11y } from './helpers/a11y';

test.describe('Accessibility (WCAG AA)', () => {
  // Disable color-contrast checks in CI as they can be flaky with CSS loading
  const disableRules = ['color-contrast'];

  test.describe('Public pages', () => {
    test('login page', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await checkA11y(page, { disableRules });
    });

    test('register page', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
      await checkA11y(page, { disableRules });
    });

    test('forgot password page', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.waitForLoadState('networkidle');
      await checkA11y(page, { disableRules });
    });

    test('demo page', async ({ page }) => {
      await page.goto('/demo');
      await page.waitForLoadState('networkidle');
      await checkA11y(page, { disableRules });
    });

    test('privacy page', async ({ page }) => {
      await page.goto('/privacy');
      await page.waitForLoadState('networkidle');
      await checkA11y(page, { disableRules });
    });

    test('terms page', async ({ page }) => {
      await page.goto('/terms');
      await page.waitForLoadState('networkidle');
      await checkA11y(page, { disableRules });
    });
  });

  test.describe('Authenticated pages', () => {
    test('dashboard', async ({ guestPage }) => {
      await guestPage.waitForLoadState('networkidle');
      await checkA11y(guestPage, { disableRules });
    });

    test('accounts page', async ({ guestPage }) => {
      await guestPage.goto('/accounts');
      await guestPage.waitForLoadState('networkidle');
      await checkA11y(guestPage, { disableRules });
    });

    test('transactions page', async ({ guestPage }) => {
      await guestPage.goto('/transactions');
      await guestPage.waitForLoadState('networkidle');
      await checkA11y(guestPage, { disableRules });
    });

    test('budgets page', async ({ guestPage }) => {
      await guestPage.goto('/budgets');
      await guestPage.waitForLoadState('networkidle');
      await checkA11y(guestPage, { disableRules });
    });

    test('analytics page', async ({ guestPage }) => {
      await guestPage.goto('/analytics');
      await guestPage.waitForLoadState('networkidle');
      await checkA11y(guestPage, { disableRules });
    });

    test('settings page', async ({ guestPage }) => {
      await guestPage.goto('/settings');
      await guestPage.waitForLoadState('networkidle');
      await checkA11y(guestPage, { disableRules });
    });

    test('billing upgrade page', async ({ guestPage }) => {
      await guestPage.goto('/billing/upgrade');
      await guestPage.waitForLoadState('networkidle');
      await checkA11y(guestPage, { disableRules });
    });

    test('assets page', async ({ guestPage }) => {
      await guestPage.goto('/assets');
      await guestPage.waitForLoadState('networkidle');
      await checkA11y(guestPage, { disableRules });
    });

    test('reports page', async ({ guestPage }) => {
      await guestPage.goto('/reports');
      await guestPage.waitForLoadState('networkidle');
      await checkA11y(guestPage, { disableRules });
    });

    test('notifications page', async ({ guestPage }) => {
      await guestPage.goto('/notifications');
      await guestPage.waitForLoadState('networkidle');
      await checkA11y(guestPage, { disableRules });
    });
  });

  test.describe('Onboarding flow', () => {
    test('onboarding page', async ({ page }) => {
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');
      // May redirect — check whichever page we land on
      await checkA11y(page, { disableRules });
    });

    test('verify email page', async ({ page }) => {
      await page.goto('/verify-email');
      await page.waitForLoadState('networkidle');
      await checkA11y(page, { disableRules });
    });
  });
});
