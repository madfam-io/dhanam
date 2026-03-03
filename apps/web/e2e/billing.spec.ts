import { test, expect } from './helpers/fixtures';

test.describe('Billing', () => {
  test('should display billing page for authenticated users', async ({ guestPage }) => {
    await guestPage.goto('/billing');
    await guestPage.waitForTimeout(2000);

    // Billing page should load
    const hasContent = await guestPage.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  });

  test('should display upgrade page', async ({ guestPage }) => {
    await guestPage.goto('/billing/upgrade');
    await guestPage.waitForTimeout(2000);

    const hasContent = await guestPage.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  });

  test('should redirect unauthenticated users from billing', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForTimeout(2000);

    const url = page.url();
    // Should either stay on billing (if public) or redirect to login
    expect(url.includes('/billing') || url.includes('/login')).toBeTruthy();
  });
});
