import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback', // OAuth callback from Janua SSO
];

// Admin pages that should be rewritten on admin subdomain
const adminPages = ['/dashboard', '/users', '/audit-logs', '/analytics', '/feature-flags'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hostname = request.headers.get('host') || '';
  const token = request.cookies.get('auth-storage');

  // === ADMIN SUBDOMAIN HANDLING ===
  const isAdminSubdomain = hostname.includes('admin.dhan.am');

  if (isAdminSubdomain) {
    // Root on admin subdomain → dashboard (authenticated) or app login (unauthenticated)
    if (path === '/') {
      if (token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.dhan.am';
      return NextResponse.redirect(new URL(`/login?from=https://admin.dhan.am`, appUrl));
    }

    // Unauthenticated users on admin subdomain → redirect to app login
    const isPublicPath = publicPaths.some((p) => path.startsWith(p));
    if (!token && !isPublicPath) {
      const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.dhan.am';
      return NextResponse.redirect(new URL(`/login?from=https://admin.dhan.am${path}`, appUrl));
    }

    // Rewrite admin subdomain paths to internal /admin/* routes
    // e.g., admin.dhan.am/dashboard → internally serves /admin/dashboard
    if (adminPages.some((p) => path === p || path.startsWith(p + '/'))) {
      return NextResponse.rewrite(new URL(`/admin${path}`, request.url));
    }

    return NextResponse.next();
  }

  // === REDIRECT OLD /admin PATHS TO ADMIN SUBDOMAIN ===
  if (path.startsWith('/admin')) {
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.dhan.am';
    const newPath = path.replace(/^\/admin/, '') || '/';
    return NextResponse.redirect(new URL(newPath, adminUrl));
  }

  // === APP SUBDOMAIN HANDLING (app.dhan.am) ===

  // Handle root path based on hostname
  if (path === '/') {
    const isAppSubdomain = hostname.includes('app.dhan.am');

    if (isAppSubdomain) {
      // On app subdomain, redirect based on auth status
      if (token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
    // Landing page domains (dhan.am, www.dhan.am, localhost) - show landing page
    return NextResponse.next();
  }

  const isPublicPath = publicPaths.some((p) => path.startsWith(p));

  // Redirect authenticated users away from auth pages
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (!isPublicPath && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
