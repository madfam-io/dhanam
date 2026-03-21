import { test, expect } from './helpers/fixtures';

test.describe('Compliance / GDPR & Retention', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/compliance');
    await expect(adminPage).toHaveURL(/\/compliance/);
  });

  test('should display the compliance page heading', async ({ adminPage }) => {
    const heading = adminPage.getByRole('heading', { name: 'Compliance' });
    await expect(heading).toBeVisible();
  });

  test('should display the page description', async ({ adminPage }) => {
    await expect(
      adminPage.getByText('GDPR data export and deletion, data retention policy execution')
    ).toBeVisible();
  });

  test('should display the GDPR Actions section', async ({ adminPage }) => {
    const section = adminPage.getByRole('heading', { name: 'GDPR Actions' });
    await expect(section).toBeVisible();
  });

  test('should display the User ID input', async ({ adminPage }) => {
    const input = adminPage.getByPlaceholder('User ID');
    await expect(input).toBeVisible();
  });

  test('should display the Export Data button', async ({ adminPage }) => {
    const button = adminPage.getByRole('button', { name: /Export Data/ });
    await expect(button).toBeVisible();
  });

  test('should display the Delete Data button', async ({ adminPage }) => {
    const button = adminPage.getByRole('button', { name: /Delete Data/ });
    await expect(button).toBeVisible();
  });

  test('should have Export and Delete buttons disabled when User ID is empty', async ({
    adminPage,
  }) => {
    const exportBtn = adminPage.getByRole('button', { name: /Export Data/ });
    const deleteBtn = adminPage.getByRole('button', { name: /Delete Data/ });
    await expect(exportBtn).toBeDisabled();
    await expect(deleteBtn).toBeDisabled();
  });

  test('should enable buttons when a User ID is entered', async ({ adminPage }) => {
    const input = adminPage.getByPlaceholder('User ID');
    await input.fill('test-user-id-123');

    const exportBtn = adminPage.getByRole('button', { name: /Export Data/ });
    const deleteBtn = adminPage.getByRole('button', { name: /Delete Data/ });
    await expect(exportBtn).toBeEnabled();
    await expect(deleteBtn).toBeEnabled();
  });

  test('should display the Data Retention section', async ({ adminPage }) => {
    const section = adminPage.getByRole('heading', { name: 'Data Retention' });
    await expect(section).toBeVisible();
  });

  test('should display the Execute Retention Policies button', async ({ adminPage }) => {
    const button = adminPage.getByRole('button', { name: /Execute Retention Policies/ });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });
});
