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
import { useTranslation } from '@dhanam/shared';
import { PersonaSwitcher } from '~/components/demo/persona-switcher';
import type { Space } from '@dhanam/shared';

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const isDemo = user?.email?.endsWith('@dhanam.demo') ?? false;
  const currentPersona = isDemo ? user?.email?.split('@')[0] : undefined;
  const spacesQuery = useSpaces();
  const spaces = spacesQuery.data as Space[] | undefined;
  const spacesLoading = spacesQuery.isLoading;
  const isPlaceholderData = spacesQuery.isPlaceholderData;
  const { currentSpace, setCurrentSpace } = useSpaceStore();
  const router = useRouter();
  const { t } = useTranslation('dashboard');

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Dhanam</h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="min-w-[200px] justify-between"
                disabled={spacesLoading && !spaces?.length}
              >
                {spacesLoading && !spaces?.length ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t('header.loading')}
                  </span>
                ) : (
                  <>
                    <span>{currentSpace?.name || t('header.selectSpace')}</span>
                    {isPlaceholderData && (
                      <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                    )}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
              <DropdownMenuLabel>{t('header.yourSpaces')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {spaces && spaces.length > 0 ? (
                <>
                  {spaces.map((space) => (
                    <DropdownMenuItem key={space.id} onClick={() => setCurrentSpace(space)}>
                      <div className="flex items-center justify-between w-full">
                        <span>{space.name}</span>
                        <span className="text-xs text-muted-foreground">{space.type}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard/spaces/new')}>
                    {t('header.createNewSpace')}
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => router.push('/dashboard/spaces/new')}>
                  {t('header.createFirstSpace')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="ml-auto flex items-center gap-4">
          {isDemo && <PersonaSwitcher currentPersona={currentPersona} />}

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
                {t('header.settings')}
              </DropdownMenuItem>
              {/* Show admin link for users with admin/owner roles */}
              {user?.spaces?.some((space) => space.role === 'admin' || space.role === 'owner') && (
                <DropdownMenuItem
                  onClick={() => {
                    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.dhan.am';
                    window.location.href = `${adminUrl}/dashboard`;
                  }}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {t('header.adminDashboard')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                {t('header.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
