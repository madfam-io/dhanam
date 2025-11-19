'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@dhanam/ui';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  TrendingUp,
  PiggyBank,
  Settings,
  FileText,
  Leaf,
  Target,
  AlertTriangle,
  Users,
  ScrollText,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Accounts',
    href: '/dashboard/accounts',
    icon: Wallet,
  },
  {
    name: 'Transactions',
    href: '/dashboard/transactions',
    icon: Receipt,
  },
  {
    name: 'Budgets',
    href: '/dashboard/budgets',
    icon: PiggyBank,
  },
  {
    name: 'Goals',
    href: '/goals',
    icon: Target,
  },
  {
    name: 'Households',
    href: '/households',
    icon: Users,
  },
  {
    name: 'Estate Planning',
    href: '/estate-planning',
    icon: ScrollText,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: TrendingUp,
  },
  {
    name: 'ESG Insights',
    href: '/dashboard/esg',
    icon: Leaf,
  },
  {
    name: 'Retirement',
    href: '/retirement',
    icon: Target,
  },
  {
    name: 'Scenarios',
    href: '/scenarios',
    icon: AlertTriangle,
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="w-64 border-r bg-background">
      <div className="flex h-full flex-col gap-y-5 overflow-y-auto px-6 pb-4">
        <ul className="flex flex-1 flex-col gap-y-7 pt-6">
          <li>
            <ul className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                        'group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 transition-colors'
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive
                            ? 'text-primary'
                            : 'text-muted-foreground group-hover:text-foreground',
                          'h-5 w-5 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  );
}
