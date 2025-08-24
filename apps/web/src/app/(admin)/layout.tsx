'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '~/components/admin/admin-nav';
import { AdminHeader } from '~/components/admin/admin-header';
import { useAuth } from '~/lib/hooks/use-auth';
import { AdminProvider } from '~/contexts/AdminContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user has admin access
    // For now, we'll check if the user has admin or owner role in any space
    // In production, you might want to have a dedicated admin flag
    const hasAdminAccess = user?.spaces?.some(
      (space) => space.role === 'admin' || space.role === 'owner'
    );

    if (!hasAdminAccess) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

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
