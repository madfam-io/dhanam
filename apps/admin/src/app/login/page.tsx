'use client';

import { useEffect, useState, Component, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { JanuaProvider, SignIn } from '@janua/react-sdk';
import { useAdminAuth } from '@/lib/hooks/use-admin-auth';

const januaConfig = {
  baseURL: process.env.NEXT_PUBLIC_OIDC_ISSUER || 'https://auth.madfam.io',
  clientId: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || 'dhanam-admin',
  debug: process.env.NODE_ENV !== 'production',
};

/** Catches errors from Janua SDK components without crashing the page */
class JanuaErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="text-center p-4">
            <p className="text-sm text-gray-500 mb-3">SSO sign-in unavailable</p>
            <a
              href="https://auth.madfam.io"
              className="inline-block px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800"
            >
              Sign in with Janua SSO
            </a>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isAdmin, _hasHydrated } = useAdminAuth();

  // Redirect authenticated admins to their intended destination
  useEffect(() => {
    if (!_hasHydrated) return;
    if (isAuthenticated && isAdmin) {
      const from = searchParams.get('from');
      router.replace(from || '/dashboard');
    }
  }, [isAuthenticated, isAdmin, _hasHydrated, router, searchParams]);

  const handleSignInSuccess = () => {
    const from = searchParams.get('from');
    router.replace(from || '/dashboard');
  };

  if (!_hasHydrated || (isAuthenticated && isAdmin)) {
    return null;
  }

  return (
    <JanuaErrorBoundary>
      <SignIn
        redirectTo={searchParams.get('from') || '/dashboard'}
        enableSSO
        socialProviders={{ google: true, github: true }}
        showRememberMe
        onSuccess={handleSignInSuccess}
      />
    </JanuaErrorBoundary>
  );
}

export default function AdminLoginPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent SSR for JanuaProvider (accesses browser APIs at module level)
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dhanam Admin</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dhanam Admin</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Welcome back</p>
        </div>
        <JanuaProvider config={januaConfig}>
          <LoginForm />
        </JanuaProvider>
      </div>
    </div>
  );
}
