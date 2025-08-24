'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@dhanam/ui/components/button';
import { useAuth } from '~/lib/hooks/use-auth';
import { Shield, LogOut, Home } from 'lucide-react';

export function AdminHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToDashboard}
              className="flex items-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Back to App</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}