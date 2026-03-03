import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@dhanam/ui', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  Skeleton: () => <div data-testid="skeleton" />,
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />,
}));

jest.mock('@dhanam/shared', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (params?.name) return `Welcome, ${params.name}`;
      return key;
    },
    locale: 'en',
    setLocale: jest.fn(),
    hasKey: () => true,
    getNamespace: () => ({}),
  }),
}));

jest.mock('lucide-react', () => ({
  TrendingUp: (props: any) => <span {...props} />,
  TrendingDown: (props: any) => <span {...props} />,
  CreditCard: (props: any) => <span {...props} />,
  PiggyBank: (props: any) => <span {...props} />,
  Target: (props: any) => <span {...props} />,
  Wallet: (props: any) => <span {...props} />,
  Receipt: (props: any) => <span {...props} />,
  Building2: (props: any) => <span {...props} />,
  Loader2: (props: any) => <span {...props} />,
  Gamepad2: (props: any) => <span {...props} />,
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null, isLoading: false }),
}));

jest.mock('~/lib/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
  }),
}));

jest.mock('~/stores/space', () => ({
  useSpaceStore: () => ({
    currentSpace: { id: 'space-1', name: 'Personal', currency: 'USD' },
  }),
}));

jest.mock('~/lib/api/analytics', () => ({
  analyticsApi: { getDashboardData: jest.fn() },
}));

jest.mock('~/lib/utils', () => ({
  formatCurrency: (amount: number, currency: string) => `$${amount.toFixed(2)}`,
}));

jest.mock('@/components/sync/sync-status', () => ({
  SyncStatus: () => <div data-testid="sync-status" />,
}));

jest.mock('@/components/demo/help-tooltip', () => ({
  HelpTooltip: () => <span data-testid="help-tooltip" />,
}));

jest.mock('@/components/demo/analytics-empty-state', () => ({
  AnalyticsEmptyState: () => <div data-testid="empty-state" />,
}));

jest.mock('@/components/goals/probabilistic-goal-card', () => ({
  ProbabilisticGoalCard: () => <div data-testid="goal-card" />,
}));

jest.mock('@/components/goals/goal-health-score', () => ({
  GoalHealthScore: () => <div data-testid="goal-health" />,
}));

jest.mock('@/components/goals/goal-probability-timeline', () => ({
  GoalProbabilityTimeline: () => <div data-testid="goal-timeline" />,
}));

jest.mock('@/components/billing/PremiumGate', () => ({
  PremiumGate: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/demo/demo-tour', () => ({
  DemoTour: () => <div data-testid="demo-tour" />,
}));

jest.mock('@/components/insights/savings-streak', () => ({
  SavingsStreak: () => <div data-testid="savings-streak" />,
}));

jest.mock('@/components/insights/insight-cards', () => ({
  InsightCards: () => <div data-testid="insight-cards" />,
}));

import DashboardPage from '../(dashboard)/dashboard/page';

describe('DashboardPage', () => {
  it('should render welcome message with user name', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
  });

  it('should render key metric cards', () => {
    render(<DashboardPage />);

    expect(screen.getByText('overview.netWorth')).toBeInTheDocument();
    expect(screen.getByText('overview.totalAssets')).toBeInTheDocument();
    expect(screen.getByText('overview.totalLiabilities')).toBeInTheDocument();
    expect(screen.getByText('overview.budgetUsage')).toBeInTheDocument();
  });

  it('should render accounts and transactions sections', () => {
    render(<DashboardPage />);

    expect(screen.getByText('overview.accountsTitle')).toBeInTheDocument();
    expect(screen.getByText('overview.recentTransactions')).toBeInTheDocument();
  });

  it('should render sync status', () => {
    render(<DashboardPage />);

    expect(screen.getByTestId('sync-status')).toBeInTheDocument();
  });
});
