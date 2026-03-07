'use client';

import { useEffect } from 'react';
import { AdminNav } from '@/components/admin-nav';
import { AdminHeader } from '@/components/admin-header';
import { useAdminAuth } from '@/lib/hooks/use-admin-auth';
import { AdminProvider } from '@/contexts/AdminContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isAdmin, _hasHydrated } = useAdminAuth();

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.dhan.am';
      const returnUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';
      window.location.href = `${appUrl}/login?from=${returnUrl}`;
      return;
    }

    if (!isAdmin) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.dhan.am';
      window.location.href = `${appUrl}/dashboard`;
    }
  }, [isAuthenticated, isAdmin, _hasHydrated]);

  if (!_hasHydrated || !isAuthenticated || !user || !isAdmin) {
    return null;
  }

  return (
    <AdminProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminHeader />
        <div className="flex">
          <AdminNav />
          <main className="flex-1 p-6">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </AdminProvider>
  );
}
