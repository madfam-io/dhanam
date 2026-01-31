import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback', // OAuth callback from Janua SSO
  '/demo',
];

const SUPPORTED_LOCALES = ['es', 'en', 'pt-BR'];

// Admin pages that should be rewritten on admin subdomain
const adminPages = ['/dashboard', '/users', '/audit-logs', '/analytics', '/feature-flags'];

// Inline geo-to-locale mapping (avoid importing from shared in edge middleware)
const COUNTRY_LOCALE: Record<string, string> = {
  MX: 'es',
  CO: 'es',
  ES: 'es',
  AR: 'es',
  CL: 'es',
  PE: 'es',
  US: 'en',
  CA: 'en',
  GB: 'en',
  AU: 'en',
  FR: 'en',
  DE: 'en',
  IT: 'en',
  NL: 'en',
  BR: 'pt-BR',
  PT: 'pt-BR',
};

function getLocaleFromCountry(country: string | null): string {
  if (!country) return 'es';
  return COUNTRY_LOCALE[country.toUpperCase()] || 'es';
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hostname = request.headers.get('host') || '';
  const token = request.cookies.get('auth-storage');

  // === WWW → APEX REDIRECT ===
  if (hostname.startsWith('www.')) {
    const apex = hostname.replace(/^www\./, '');
    const url = new URL(request.url);
    url.host = apex;
    return NextResponse.redirect(url, 301);
  }

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

  // === GEO DETECTION (for all routes) ===
  const countryCode = request.headers.get('cf-ipcountry') || null;
  const response = NextResponse.next();

  // Set geo cookie if not already set
  if (countryCode && !request.cookies.get('dhanam_geo')) {
    response.cookies.set('dhanam_geo', countryCode, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
      sameSite: 'lax',
    });
  }

  // Set geo headers for downstream use
  if (countryCode) {
    response.headers.set('x-geo-country', countryCode);
    response.headers.set('x-geo-locale', getLocaleFromCountry(countryCode));
  }

  // === LANDING PAGE LOCALE ROUTING ===
  const isLandingDomain =
    hostname.includes('dhan.am') &&
    !hostname.includes('app.dhan.am') &&
    !hostname.includes('admin.dhan.am') &&
    !hostname.includes('api.dhan.am');
  const isLocalhost = hostname.includes('localhost');
  const isLandingSite = isLandingDomain || isLocalhost;

  // Check if path is a locale-prefixed landing route
  const localeMatch = path.match(/^\/(es|en|pt-BR)(\/.*)?$/);

  if (isLandingSite && path === '/') {
    // Root landing page → redirect to locale prefix
    const savedLocale = request.cookies.get('dhanam_locale')?.value;
    const geoLocale = getLocaleFromCountry(request.cookies.get('dhanam_geo')?.value || countryCode);
    const locale = savedLocale && SUPPORTED_LOCALES.includes(savedLocale) ? savedLocale : geoLocale;

    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  if (isLandingSite && localeMatch) {
    const locale = localeMatch[1] ?? 'en';
    const subPath = localeMatch[2] || '';

    // Only handle landing-specific routes under locale prefix
    // If there's no subpath or it's a landing-related path, rewrite to landing page
    if (!subPath || subPath === '/') {
      // Set locale cookie
      const rewrite = NextResponse.rewrite(new URL(`/${locale}/landing`, request.url));
      rewrite.cookies.set('dhanam_locale', locale, {
        maxAge: 365 * 24 * 60 * 60,
        path: '/',
        sameSite: 'lax',
      });
      if (countryCode && !request.cookies.get('dhanam_geo')) {
        rewrite.cookies.set('dhanam_geo', countryCode, {
          maxAge: 365 * 24 * 60 * 60,
          path: '/',
          sameSite: 'lax',
        });
      }
      return rewrite;
    }
  }

  // === APP SUBDOMAIN HANDLING (app.dhan.am) ===
  if (path === '/') {
    const isAppSubdomain = hostname.includes('app.dhan.am');

    if (isAppSubdomain) {
      if (token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
    return response;
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

  return response;
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
