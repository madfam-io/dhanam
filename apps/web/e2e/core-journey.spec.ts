import { test, expect } from './helpers/fixtures';

/**
 * Core User Journey E2E Tests
 *
 * Validates the primary navigation paths and page rendering for an
 * authenticated guest user. Each test uses the `guestPage` fixture
 * which logs in via the guest-login API and lands on /dashboard.
 *
 * Navigation selectors target the sidebar's `data-tour` attributes
 * (e.g. data-tour="sidebar-accounts") and link hrefs from dashboard-nav.
 */

test.describe('Core User Journey', () => {
  test('guest user can access dashboard', async ({ guestPage }) => {
    // guestPage fixture already navigates to /dashboard after guest login
    await expect(guestPage.locator('h1')).toBeVisible();
    await expect(guestPage).toHaveURL(/dashboard/);
  });

  test('dashboard shows metric cards', async ({ guestPage }) => {
    // The dashboard renders metric cards including a net-worth tour target
    const metricCard = guestPage.locator('[data-tour="net-worth"], [class*="Card"]');
    const cardCount = await metricCard.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);
  });

  test('can navigate to accounts page', async ({ guestPage }) => {
    await guestPage.locator('[data-tour="sidebar-accounts"] a').click();
    await guestPage.waitForURL('**/accounts');
    await expect(guestPage.locator('h1')).toBeVisible();
  });

  test('can navigate to transactions page', async ({ guestPage }) => {
    await guestPage.locator('[data-tour="sidebar-transactions"] a').click();
    await guestPage.waitForURL('**/transactions');
    await expect(guestPage.locator('h1')).toBeVisible();
  });

  test('can navigate to budgets page', async ({ guestPage }) => {
    await guestPage.locator('[data-tour="sidebar-budgets"] a').click();
    await guestPage.waitForURL('**/budgets');
    await expect(guestPage.locator('h1')).toBeVisible();
  });

  test('can navigate to analytics page', async ({ guestPage }) => {
    await guestPage.locator('[data-tour="sidebar-analytics"] a').click();
    await guestPage.waitForURL('**/analytics');
    await expect(guestPage.locator('h1')).toBeVisible();
  });

  test('can navigate to settings page', async ({ guestPage }) => {
    await guestPage.locator('[data-tour="sidebar-settings"] a').click();
    await guestPage.waitForURL('**/settings');
    await expect(guestPage.locator('h1')).toBeVisible();
  });

  test('can navigate to assets page', async ({ guestPage }) => {
    // Assets is not in the sidebar nav; navigate directly
    await guestPage.goto('/assets');
    await expect(guestPage.locator('h1')).toBeVisible();
  });

  test('can navigate to estate planning', async ({ guestPage }) => {
    await guestPage.locator('[data-tour="sidebar-estatePlanning"] a').click();
    await guestPage.waitForURL('**/estate-planning');
    await expect(guestPage.locator('h1')).toBeVisible();
  });

  test('can navigate to households', async ({ guestPage }) => {
    await guestPage.locator('[data-tour="sidebar-households"] a').click();
    await guestPage.waitForURL('**/households');
    await expect(guestPage.locator('h1')).toBeVisible();
  });

  test('can navigate to reports', async ({ guestPage }) => {
    await guestPage.locator('[data-tour="sidebar-reports"] a').click();
    await guestPage.waitForURL('**/reports');
    await expect(guestPage.locator('h1')).toBeVisible();
  });

  test('can navigate to notifications', async ({ guestPage }) => {
    // Notifications is not in the sidebar nav; navigate directly
    await guestPage.goto('/notifications');
    await expect(guestPage.locator('h1')).toBeVisible();
  });
});
