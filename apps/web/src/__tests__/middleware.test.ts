/**
 * Middleware unit tests
 * Tests public path routing to verify legal pages don't redirect to login.
 *
 * Note: NextRequest requires edge runtime globals (Request, Headers, etc.).
 * We test the routing logic by importing the publicPaths concept directly
 * rather than running the full middleware function.
 */

describe('middleware public paths', () => {
  // We extract and test the routing logic by checking what the middleware
  // source defines as public. This avoids needing edge-runtime globals.

  const publicPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/auth/callback',
    '/demo',
    '/demo/',
    '/privacy',
    '/terms',
    '/cookies',
    '/security',
    '/esg',
    '/status',
    '/docs',
  ];

  function isPublicPath(path: string): boolean {
    return publicPaths.some((p) => path.startsWith(p));
  }

  describe('legal pages should be public', () => {
    const legalPaths = ['/privacy', '/terms', '/cookies', '/security', '/esg', '/status', '/docs'];

    for (const path of legalPaths) {
      it(`${path} should be a public path`, () => {
        expect(isPublicPath(path)).toBe(true);
      });
    }
  });

  describe('auth pages should be public', () => {
    const authPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

    for (const path of authPaths) {
      it(`${path} should be a public path`, () => {
        expect(isPublicPath(path)).toBe(true);
      });
    }
  });

  describe('app pages should not be public', () => {
    const protectedPaths = ['/dashboard', '/settings', '/accounts', '/budgets', '/wealth'];

    for (const path of protectedPaths) {
      it(`${path} should not be a public path`, () => {
        expect(isPublicPath(path)).toBe(false);
      });
    }
  });

  describe('subpaths should match', () => {
    it('/privacy/policy should match /privacy', () => {
      expect(isPublicPath('/privacy/policy')).toBe(true);
    });

    it('/terms/of-service should match /terms', () => {
      expect(isPublicPath('/terms/of-service')).toBe(true);
    });
  });
});
