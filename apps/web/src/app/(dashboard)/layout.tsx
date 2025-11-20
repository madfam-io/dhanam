'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardNav } from '~/components/layout/dashboard-nav';
import { DashboardHeader } from '~/components/layout/dashboard-header';
import { DemoModeBanner } from '~/components/demo/demo-mode-banner';
import { useAuth } from '~/lib/hooks/use-auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
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
