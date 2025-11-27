import { NextRequest, NextResponse } from 'next/server';

const JANUA_API_URL = process.env.NEXT_PUBLIC_JANUA_API_URL || 'http://localhost:8000';

/**
 * OAuth Callback Handler
 *
 * Exchanges the authorization code from Janua for tokens
 * and sets authentication cookies.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { provider } = params;
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error(`OAuth error from ${provider}:`, error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=Missing%20authorization%20code', request.url)
    );
  }

  try {
    // Exchange code for tokens via Janua
    const callbackUrl = `${JANUA_API_URL}/api/v1/auth/oauth/callback/${provider}`;
    const tokenParams = new URLSearchParams({ code });
    if (state) {
      tokenParams.set('state', state);
    }

    const response = await fetch(`${callbackUrl}?${tokenParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/login?error=Authentication%20failed', request.url)
      );
    }

    const data = await response.json();

    // Extract tokens and user from response
    const { access_token, refresh_token, user } = data;

    if (!access_token) {
      return NextResponse.redirect(
        new URL('/login?error=No%20access%20token%20received', request.url)
      );
    }

    // Determine redirect destination
    const redirectTo = searchParams.get('redirect_to') || '/dashboard';

    // Create response with redirect
    const redirectResponse = NextResponse.redirect(new URL(redirectTo, request.url));

    // Set authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    redirectResponse.cookies.set('access_token', access_token, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 minutes
    });

    if (refresh_token) {
      redirectResponse.cookies.set('refresh_token', refresh_token, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    // Store user info in localStorage via a temporary cookie
    // (will be processed by client-side code)
    if (user) {
      redirectResponse.cookies.set('janua_user', JSON.stringify(user), {
        ...cookieOptions,
        httpOnly: false, // Readable by client
        maxAge: 60, // 1 minute - just for transfer
      });
    }

    return redirectResponse;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=Authentication%20error', request.url)
    );
  }
}
