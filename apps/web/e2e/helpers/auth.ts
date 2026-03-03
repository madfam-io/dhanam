import { Page } from '@playwright/test';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:4010';

/**
 * Login as demo guest user via API and set auth cookies/storage
 */
export async function loginAsGuest(page: Page): Promise<void> {
  const response = await page.request.post(`${API_BASE}/auth/guest-login`, {
    data: {},
  });

  if (!response.ok()) {
    throw new Error(`Guest login failed: ${response.status()}`);
  }

  const data = await response.json();

  // Store tokens in localStorage to match the web app auth pattern
  await page.evaluate(
    ({ tokens, user }) => {
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));
      localStorage.setItem('auth_user', JSON.stringify(user));
    },
    { tokens: data.tokens, user: data.user },
  );
}

/**
 * Login with email/password via the API
 */
export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  const response = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email, password },
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()}`);
  }

  const data = await response.json();

  await page.evaluate(
    ({ tokens, user }) => {
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));
      localStorage.setItem('auth_user', JSON.stringify(user));
    },
    { tokens: data.tokens, user: data.user },
  );
}

/**
 * Login via the UI (filling form fields)
 */
export async function loginViaUI(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"], [aria-label="Email"]', email);
  await page.fill('input[name="password"], [aria-label="Password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

/**
 * Clear authentication state
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_user');
  });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const tokens = localStorage.getItem('auth_tokens');
    return tokens !== null;
  });
}
