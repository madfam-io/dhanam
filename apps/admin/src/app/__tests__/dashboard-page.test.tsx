import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@dhanam/ui', () =>
  new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === '__esModule') return true;
        return ({ children, ...props }: any) => (
          <div data-testid={String(prop).toLowerCase()} {...props}>
            {children}
          </div>
        );
      },
    },
  ),
);

jest.mock('@dhanam/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: jest.fn(),
  }),
}));

jest.mock('lucide-react', () =>
  new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === '__esModule') return true;
        return (props: any) => <span data-testid={`icon-${String(prop)}`} {...props} />;
      },
    },
  ),
);

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null, isLoading: false }),
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock('@/lib/hooks/use-admin-auth', () => ({
  useAdminAuth: () => ({
    user: { id: 'admin-1', email: 'admin@test.com', name: 'Admin' },
    logout: jest.fn(),
    isAuthenticated: true,
  }),
}));

jest.mock('@/lib/api/admin', () => ({
  adminApi: {
    getStats: jest.fn(),
    getUsers: jest.fn(),
    getAuditLogs: jest.fn(),
    getSystemHealth: jest.fn(),
    getQueues: jest.fn(),
    getProviders: jest.fn(),
    getFeatureFlags: jest.fn(),
    getBillingEvents: jest.fn(),
    getDeploymentStatus: jest.fn(),
    getSpaces: jest.fn(),
    gdprExport: jest.fn(),
    gdprDelete: jest.fn(),
    executeRetention: jest.fn(),
    retryFailedJobs: jest.fn(),
    clearQueue: jest.fn(),
    flushCache: jest.fn(),
    toggleFeatureFlag: jest.fn(),
  },
}));

let mockUseAdmin: () => any;

jest.mock('@/contexts/AdminContext', () => ({
  useAdmin: () => mockUseAdmin(),
}));

jest.mock('@/components/stats-card', () => ({
  StatsCard: ({ title, value, subtitle }: any) => (
    <div data-testid="stats-card">
      <span>{title}</span>
      <span>{value}</span>
      {subtitle && <span>{subtitle}</span>}
    </div>
  ),
}));

import AdminDashboard from '../../(dashboard)/dashboard/page';

describe('AdminDashboard', () => {
  beforeEach(() => {
    mockUseAdmin = () => ({
      systemStats: {
        users: { total: 100, verified: 80, active30Days: 50, withTotp: 20 },
        spaces: { total: 60, personal: 40, business: 20 },
        accounts: { total: 90, connected: 70, byProvider: { belvo: 30, plaid: 40 } },
        transactions: { total: 5000, last30Days: 300, categorized: 4500 },
      },
      isLoading: false,
    });
  });

  it('should render the Admin Dashboard heading', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('should render system overview subtitle', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('System overview and statistics')).toBeInTheDocument();
  });

  it('should render stats cards for key metrics', () => {
    render(<AdminDashboard />);
    const statsCards = screen.getAllByTestId('stats-card');
    expect(statsCards.length).toBe(6);
  });

  it('should display Account Providers section', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Account Providers')).toBeInTheDocument();
  });

  it('should render skeleton when loading', () => {
    mockUseAdmin = () => ({
      systemStats: null,
      isLoading: true,
    });

    render(<AdminDashboard />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
