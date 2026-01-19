'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  exchangeCodeForTokens,
  getStoredCodeVerifier,
  clearStoredCodeVerifier,
} from '~/lib/janua-oauth';
import { useAuth } from '~/lib/hooks/use-auth';

/**
 * Janua SSO Callback Page
 *
 * Handles the OAuth callback from Janua, exchanges the authorization code
 * for tokens using PKCE, and redirects to the dashboard.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuth();
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

        // Extract tokens
        const { access_token, refresh_token, user } = tokenData as {
          access_token: string;
          refresh_token?: string;
          user?: { id: string; email: string; name?: string };
        };

        if (!access_token) {
          throw new Error('No access token received');
        }

        // If we have user data and tokens, set auth state
        if (user) {
          setAuth(user, {
            accessToken: access_token,
            refreshToken: refresh_token || '',
          });
        } else {
          // Store tokens in cookies for the auth hook to pick up
          document.cookie = `access_token=${access_token}; path=/; max-age=${15 * 60}; SameSite=Lax${
            process.env.NODE_ENV === 'production' ? '; Secure' : ''
          }`;
          if (refresh_token) {
            document.cookie = `refresh_token=${refresh_token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax${
              process.env.NODE_ENV === 'production' ? '; Secure' : ''
            }`;
          }
        }

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
  }, [searchParams, router, setAuth]);

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
