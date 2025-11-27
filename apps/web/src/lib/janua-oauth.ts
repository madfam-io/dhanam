/**
 * Janua OAuth Integration
 *
 * Helper utilities for OAuth authentication via Janua SSO
 */

const JANUA_API_URL = process.env.NEXT_PUBLIC_JANUA_API_URL || 'http://localhost:8000';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

/**
 * Get the OAuth authorization URL for a provider
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
 * Initiate OAuth login flow
 */
export function loginWithOAuth(provider: OAuthProviderId, redirectTo?: string): void {
  if (typeof window === 'undefined') return;

  const url = getJanuaOAuthUrl(provider, redirectTo || window.location.pathname);
  window.location.href = url;
}

/**
 * Check if Janua OAuth is enabled
 */
export function isJanuaOAuthEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_JANUA_API_URL;
}
