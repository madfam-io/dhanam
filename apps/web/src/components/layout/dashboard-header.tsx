'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@dhanam/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@dhanam/ui';
import { Bell, Settings, User, LogOut, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '~/lib/hooks/use-auth';
import { useSpaces } from '~/lib/hooks/use-spaces';
import { useSpaceStore } from '~/stores/space';

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const { data: spaces } = useSpaces();
  const { currentSpace, setCurrentSpace } = useSpaceStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Dhanam</h1>

          {spaces && spaces.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[200px] justify-between">
                  <span>{currentSpace?.name || 'Select Space'}</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px]">
                <DropdownMenuLabel>Your Spaces</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {spaces.map((space: { id: string; name: string; type: string }) => (
                  <DropdownMenuItem key={space.id} onClick={() => setCurrentSpace(space)}>
                    <div className="flex items-center justify-between w-full">
                      <span>{space.name}</span>
                      <span className="text-xs text-muted-foreground">{space.type}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard/spaces/new')}>
                  Create New Space
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span>{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              {/* Show admin link for users with admin/owner roles */}
              {user?.spaces?.some((space) => space.role === 'admin' || space.role === 'owner') && (
                <DropdownMenuItem onClick={() => router.push('/admin/dashboard')}>
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
