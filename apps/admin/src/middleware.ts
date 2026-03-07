import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth-storage');

  if (!authCookie) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.dhan.am';
    const returnUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(`${appUrl}/login?from=${returnUrl}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
