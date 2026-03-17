import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth-storage');

  if (!authCookie) {
    const loginUrl = new URL('/login', request.url);

    // Use pathname only to avoid leaking internal addresses (e.g. 0.0.0.0:3400)
    const pathname = request.nextUrl.pathname;
    if (pathname !== '/') {
      loginUrl.searchParams.set('from', pathname);
    }

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};
