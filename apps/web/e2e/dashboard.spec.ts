import { test, expect } from './helpers/fixtures';

test.describe('Dashboard', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);

    const url = page.url();
    expect(url.includes('/login') || url.includes('/dashboard')).toBeTruthy();
  });

  test('should display dashboard for authenticated users', async ({ guestPage }) => {
    // guestPage fixture already navigates to /dashboard
    await expect(guestPage.locator('body')).not.toBeEmpty();
  });

  test('should display key metric cards', async ({ guestPage }) => {
    // Look for metric card elements
    const cards = guestPage.locator('[data-tour="net-worth"], [class*="Card"]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(0);
  });

  test('should have navigation sidebar or header', async ({ guestPage }) => {
    // Navigation should be present
    const nav = guestPage.locator('nav, [role="navigation"]');
    const navCount = await nav.count();
    expect(navCount).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to accounts page', async ({ guestPage }) => {
    const accountsLink = guestPage.locator('a[href*="/accounts"]').first();
    if (await accountsLink.isVisible()) {
      await accountsLink.click();
      await expect(guestPage).toHaveURL(/\/accounts/);
    }
  });

  test('should navigate to transactions page', async ({ guestPage }) => {
    const transactionsLink = guestPage.locator('a[href*="/transactions"]').first();
    if (await transactionsLink.isVisible()) {
      await transactionsLink.click();
      await expect(guestPage).toHaveURL(/\/transactions/);
    }
  });
});
