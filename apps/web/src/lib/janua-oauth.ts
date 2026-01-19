/**
 * Janua OAuth Integration
 *
 * Helper utilities for OAuth authentication via Janua SSO
 */

const JANUA_API_URL = process.env.NEXT_PUBLIC_JANUA_API_URL || 'http://localhost:8000';
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const OIDC_CLIENT_ID = process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || 'dhanam-web';

/**
 * Available OAuth providers from Janua
 */
export const oauthProviders = [
  { id: 'google', name: 'Google', icon: '🔵', color: '#4285F4' },
  { id: 'github', name: 'GitHub', icon: '⚫', color: '#24292e' },
  { id: 'microsoft', name: 'Microsoft', icon: '🟦', color: '#00a4ef' },
  { id: 'apple', name: 'Apple', icon: '🍎', color: '#000000' },
  { id: 'discord', name: 'Discord', icon: '🟣', color: '#5865F2' },
] as const;

export type OAuthProviderId = typeof oauthProviders[number]['id'];

// ============================================================================
// PKCE Helpers for Secure OAuth 2.0 Flow
// ============================================================================

/**
 * Generate a cryptographically random code verifier for PKCE
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a code challenge from a verifier using SHA-256
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  // Base64URL encoding (replace + with -, / with _, remove =)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ============================================================================
// Direct Janua SSO (PKCE OAuth Flow)
// ============================================================================

/**
 * Initiate Janua SSO login with PKCE
 * This redirects to Janua's login page where users authenticate with email/password
 */
export async function loginWithJanuaSSO(redirectTo?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store verifier for callback (will be used in token exchange)
  sessionStorage.setItem('janua_code_verifier', codeVerifier);

  // Build authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OIDC_CLIENT_ID,
    redirect_uri: `${APP_URL}/auth/callback`,
    scope: 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  if (redirectTo) {
    params.set('state', redirectTo);
  }

  // Redirect to Janua
  window.location.href = `${JANUA_API_URL}/api/v1/oauth/authorize?${params.toString()}`;
}

/**
 * Get stored PKCE code verifier
 */
export function getStoredCodeVerifier(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('janua_code_verifier');
}

/**
 * Clear stored PKCE code verifier
 */
export function clearStoredCodeVerifier(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('janua_code_verifier');
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<{ access_token: string; refresh_token?: string; user?: unknown }> {
  const response = await fetch(`${JANUA_API_URL}/api/v1/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: OIDC_CLIENT_ID,
      code,
      redirect_uri: `${APP_URL}/auth/callback`,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Token exchange failed' }));
    throw new Error(error.error_description || error.message || 'Token exchange failed');
  }

  return response.json();
}

// ============================================================================
// Social OAuth Providers (via Janua Proxy)
// ============================================================================

/**
 * Get the OAuth authorization URL for a social provider
 */
export function getJanuaOAuthUrl(provider: OAuthProviderId, redirectTo?: string): string {
  const callbackUrl = `${APP_URL}/api/auth/callback/${provider}`;
  const params = new URLSearchParams({
    redirect_uri: callbackUrl,
  });

  if (redirectTo) {
    params.set('redirect_to', redirectTo);
  }

  return `${JANUA_API_URL}/api/v1/auth/oauth/authorize/${provider}?${params.toString()}`;
}

/**
 * Initiate OAuth login flow with a social provider
 */
export function loginWithOAuth(provider: OAuthProviderId, redirectTo?: string): void {
  if (typeof window === 'undefined') return;

  const url = getJanuaOAuthUrl(provider, redirectTo || window.location.pathname);
  window.location.href = url;
}

// ============================================================================
// Configuration Helpers
// ============================================================================

/**
 * Check if Janua OAuth is enabled
 */
export function isJanuaOAuthEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_JANUA_API_URL;
}

/**
 * Get Janua API URL
 */
export function getJanuaApiUrl(): string {
  return JANUA_API_URL;
}

/**
 * Get OAuth client ID
 */
export function getOAuthClientId(): string {
  return OIDC_CLIENT_ID;
}
