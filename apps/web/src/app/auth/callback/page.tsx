'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  exchangeCodeForTokens,
  getStoredCodeVerifier,
  clearStoredCodeVerifier,
} from '~/lib/janua-oauth';

/**
 * Loading fallback for the callback page
 */
function CallbackLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <h2 className="text-xl font-semibold">Completing sign in...</h2>
        <p className="text-muted-foreground mt-2">Please wait while we verify your credentials.</p>
      </div>
    </div>
  );
}

/**
 * Callback content that uses useSearchParams
 */
function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const state = searchParams.get('state'); // Contains redirect path if provided

      // Handle OAuth errors from Janua
      if (error) {
        console.error('OAuth error:', error, errorDescription);
        setStatus('error');
        setErrorMessage(errorDescription || error);
        setTimeout(() => {
          router.push(`/login?error=${encodeURIComponent(errorDescription || error)}`);
        }, 2000);
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code received');
        setTimeout(() => {
          router.push('/login?error=Missing%20authorization%20code');
        }, 2000);
        return;
      }

      // Get the PKCE code verifier from session storage
      const codeVerifier = getStoredCodeVerifier();
      if (!codeVerifier) {
        setStatus('error');
        setErrorMessage('Session expired. Please try logging in again.');
        setTimeout(() => {
          router.push('/login?error=Session%20expired');
        }, 2000);
        return;
      }

      try {
        // Exchange authorization code for tokens
        const tokenData = await exchangeCodeForTokens(code, codeVerifier);

        // Clear the code verifier from session storage
        clearStoredCodeVerifier();

        // Extract tokens from Janua OAuth response
        const { access_token, refresh_token } = tokenData as {
          access_token: string;
          refresh_token?: string;
          id_token?: string;
        };

        if (!access_token) {
          throw new Error('No access token received');
        }

        // Store tokens in localStorage for the auth system to use
        // The Zustand auth store will pick these up and fetch the full user profile
        localStorage.setItem('janua_access_token', access_token);
        if (refresh_token) {
          localStorage.setItem('janua_refresh_token', refresh_token);
        }

        // Also store in the auth-storage key that Zustand persists to
        // This ensures immediate auth state on redirect
        const authStorage = {
          state: {
            tokens: {
              accessToken: access_token,
              refreshToken: refresh_token || '',
            },
            token: access_token,
            isAuthenticated: true,
            // User will be fetched on dashboard load via refreshUser
            user: null,
          },
          version: 0,
        };
        localStorage.setItem('auth-storage', JSON.stringify(authStorage));

        setStatus('success');

        // Redirect to the intended destination or dashboard
        const redirectTo = state || '/dashboard';
        setTimeout(() => {
          router.push(redirectTo);
        }, 1000);
      } catch (err) {
        console.error('Token exchange error:', err);
        clearStoredCodeVerifier();
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Authentication failed');
        setTimeout(() => {
          router.push('/login?error=Authentication%20failed');
        }, 2000);
      }
    }

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <div className="mb-4 h-12 w-12 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h2 className="text-xl font-semibold">Completing sign in...</h2>
            <p className="text-muted-foreground mt-2">Please wait while we verify your credentials.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-4 h-12 w-12 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-600">Sign in successful!</h2>
            <p className="text-muted-foreground mt-2">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4 h-12 w-12 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-600">Sign in failed</h2>
            <p className="text-muted-foreground mt-2">{errorMessage}</p>
            <p className="text-sm text-muted-foreground mt-1">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Janua SSO Callback Page
 *
 * Handles the OAuth callback from Janua, exchanges the authorization code
 * for tokens using PKCE, and redirects to the dashboard.
 *
 * Wrapped in Suspense to handle useSearchParams during static generation.
 */
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <CallbackContent />
    </Suspense>
  );
}
