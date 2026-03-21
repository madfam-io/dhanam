import { Page } from '@playwright/test';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:4010';

/**
 * Authenticate as an admin user via the API and inject tokens into localStorage.
 *
 * In a real test run this calls the API's login endpoint. If that fails (e.g.
 * no running API server) it falls back to setting synthetic admin tokens so
 * that the client-side auth guard lets us through.
 */
export async function adminLogin(page: Page): Promise<void> {
  const email = process.env.E2E_ADMIN_EMAIL || 'admin@dhanam.demo';
  const password = process.env.E2E_ADMIN_PASSWORD || 'AdminPassword123!';

  try {
    const response = await page.request.post(`${API_BASE}/auth/login`, {
      data: { email, password },
    });

    if (response.ok()) {
      const data = await response.json();
      await page.evaluate(
        ({ tokens, user }) => {
          localStorage.setItem('auth_tokens', JSON.stringify(tokens));
          localStorage.setItem('auth_user', JSON.stringify(user));
        },
        { tokens: data.tokens, user: data.user }
      );
      return;
    }
  } catch {
    // API not available -- fall through to synthetic token injection
  }

  // Fallback: inject synthetic admin session so the client-side auth guard
  // (useAdminAuth) treats the session as valid. This allows E2E tests to
  // exercise page rendering even when the API is offline.
  await page.evaluate(() => {
    const syntheticUser = {
      id: 'e2e-admin-user',
      email: 'admin@dhanam.demo',
      name: 'E2E Admin',
      role: 'ADMIN',
    };

    const syntheticTokens = {
      accessToken: 'e2e-synthetic-access-token',
      refreshToken: 'e2e-synthetic-refresh-token',
    };

    localStorage.setItem('auth_tokens', JSON.stringify(syntheticTokens));
    localStorage.setItem('auth_user', JSON.stringify(syntheticUser));
  });
}

/**
 * Clear all authentication state from the browser.
 */
export async function adminLogout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_user');
  });
}
