'use client';

import { useEffect } from 'react';
import { AdminNav } from '~/components/admin/admin-nav';
import { AdminHeader } from '~/components/admin/admin-header';
import { useAuth } from '~/lib/hooks/use-auth';
import { AdminProvider } from '~/contexts/AdminContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to app subdomain login with return URL for cross-subdomain auth
      const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.dhan.am';
      const returnUrl =
        typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';
      window.location.href = `${appUrl}/login?from=${returnUrl}`;
      return;
    }

    // Check if user has admin access
    // For now, we'll check if the user has admin or owner role in any space
    // In production, you might want to have a dedicated admin flag
    const hasAdminAccess = user?.spaces?.some(
      (space) => space.role === 'admin' || space.role === 'owner'
    );

    if (!hasAdminAccess) {
      // Redirect non-admins to app subdomain dashboard
      const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.dhan.am';
      window.location.href = `${appUrl}/dashboard`;
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAdminAccess = user.spaces?.some(
    (space) => space.role === 'admin' || space.role === 'owner'
  );

  if (!hasAdminAccess) {
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
