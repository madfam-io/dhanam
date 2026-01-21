'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardNav } from '~/components/layout/dashboard-nav';
import { DashboardHeader } from '~/components/layout/dashboard-header';
import { DemoModeBanner } from '~/components/demo/demo-mode-banner';
import { useAuth } from '~/lib/hooks/use-auth';

/**
 * Loading skeleton shown during SSR and initial client hydration.
 * Must match on both server and client to prevent hydration mismatch.
 */
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 border-b bg-card animate-pulse" />
      <div className="flex">
        <div className="w-64 border-r bg-card animate-pulse hidden md:block" />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            <div className="h-8 w-48 bg-muted rounded animate-pulse mb-4" />
            <div className="h-64 bg-muted rounded animate-pulse" />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _hasHydrated, user, refreshUser } = useAuth();
  const router = useRouter();
  // Track if client has hydrated - prevents SSR/client mismatch
  const [hasMounted, setHasMounted] = useState(false);
  // Track if we've attempted to fetch user profile
  const [userFetchAttempted, setUserFetchAttempted] = useState(false);

  // Mark as mounted after initial render (client-side only)
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Fetch user profile if we have tokens but no user data
  // This happens after SSO login where only tokens are stored
  useEffect(() => {
    if (hasMounted && _hasHydrated && isAuthenticated && !user && !userFetchAttempted) {
      setUserFetchAttempted(true);
      refreshUser().catch((error) => {
        console.error('Failed to fetch user profile:', error);
      });
    }
  }, [hasMounted, _hasHydrated, isAuthenticated, user, userFetchAttempted, refreshUser]);

  // Redirect unauthenticated users after Zustand hydration is complete
  useEffect(() => {
    if (hasMounted && _hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hasMounted, _hasHydrated, isAuthenticated, router]);

  // Show skeleton during SSR and initial hydration
  // This ensures server and client render the same content initially
  if (!hasMounted) {
    return <DashboardSkeleton />;
  }

  // Wait for Zustand to hydrate from localStorage before deciding
  if (!_hasHydrated) {
    return <DashboardSkeleton />;
  }

  // After hydration, if not authenticated, show skeleton while redirecting
  if (!isAuthenticated) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <DemoModeBanner />
      <div className="flex">
        <DashboardNav />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
