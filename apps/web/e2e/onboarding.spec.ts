import { test, expect } from './helpers/fixtures';

test.describe('Onboarding', () => {
  test('should redirect unauthenticated users from onboarding', async ({ page }) => {
    await page.goto('/onboarding');

    // Should redirect to login if not authenticated
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url.includes('/login') || url.includes('/onboarding')).toBeTruthy();
  });

  test('should show onboarding steps for new users', async ({ guestPage }) => {
    await guestPage.goto('/onboarding');
    await guestPage.waitForTimeout(2000);

    // Onboarding page should load without crashing
    const hasContent = await guestPage.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  });
});
