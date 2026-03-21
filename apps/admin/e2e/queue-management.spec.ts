import { test, expect } from './helpers/fixtures';

test.describe('Queue Management', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/queues');
    await expect(adminPage).toHaveURL(/\/queues/);
  });

  test('should display the queue management page heading', async ({ adminPage }) => {
    const heading = adminPage.getByRole('heading', { name: 'Queue Management' });
    await expect(heading).toBeVisible();
  });

  test('should display the page subtitle', async ({ adminPage }) => {
    await expect(adminPage.getByText('BullMQ queue stats and actions')).toBeVisible();
  });

  test('should display the Refresh button', async ({ adminPage }) => {
    const refreshButton = adminPage.getByRole('button', { name: /Refresh/ });
    await expect(refreshButton).toBeVisible();
  });

  test('should display queue cards or empty state after loading', async ({ adminPage }) => {
    // Wait for the loading state to resolve. The page shows either:
    // - QueueCard components (each inside a Card with queue name and status badge)
    // - An empty state message "No queue data available"
    // - Skeleton placeholders while loading
    //
    // We wait up to 10 seconds for either real content or the empty state.
    const queueCards = adminPage.locator('[class*="grid"] >> text=/Recent Jobs|Failed/');
    const emptyState = adminPage.getByText('No queue data available');

    await expect(queueCards.first().or(emptyState)).toBeVisible({ timeout: 10000 });
  });

  test('should display queue action buttons when queues are loaded', async ({ adminPage }) => {
    // If queues load, each QueueCard has "Retry Failed" and "Clear" buttons.
    // If there are no queues, skip this assertion gracefully.
    const retryButton = adminPage.getByRole('button', { name: /Retry Failed/ }).first();
    const clearButton = adminPage.getByRole('button', { name: /Clear/ }).first();
    const emptyState = adminPage.getByText('No queue data available');

    // Wait for loading to finish
    await expect(retryButton.or(emptyState)).toBeVisible({ timeout: 10000 });

    if (await emptyState.isVisible()) {
      // No queues loaded -- nothing more to check
      return;
    }

    await expect(retryButton).toBeVisible();
    await expect(clearButton).toBeVisible();
  });
});
