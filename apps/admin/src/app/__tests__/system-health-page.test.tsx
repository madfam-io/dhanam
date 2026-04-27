import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock(
  '@dhanam/ui',
  () =>
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
      }
    )
);

jest.mock('@dhanam/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: jest.fn(),
  }),
}));

jest.mock(
  'lucide-react',
  () =>
    new Proxy(
      {},
      {
        get: (_, prop) => {
          if (prop === '__esModule') return true;
          return (props: any) => <span data-testid={`icon-${String(prop)}`} {...props} />;
        },
      }
    )
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
    getSystemHealth: jest.fn().mockResolvedValue({
      database: { status: 'healthy', connections: 5 },
      redis: { status: 'healthy', connected: true },
      queues: { status: 'healthy' },
      providers: { status: 'healthy' },
      uptime: 86400,
    }),
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
    getMetrics: jest.fn().mockResolvedValue({
      dau: 50,
      wau: 200,
      mau: 500,
      resourceUsage: { memoryMB: 256 },
    }),
  },
}));

jest.mock('@/components/health-status-card', () => ({
  HealthStatusCard: ({ services }: any) => (
    <div data-testid="health-status-card">
      {services?.map((s: any) => (
        <span key={s.name}>{s.name}</span>
      ))}
    </div>
  ),
}));

jest.mock('@/components/cache-controls', () => ({
  CacheControls: () => <div data-testid="cache-controls" />,
}));

jest.mock('@/components/stats-card', () => ({
  StatsCard: ({ title, value }: any) => (
    <div data-testid="stats-card">
      <span>{title}</span>
      <span>{value}</span>
    </div>
  ),
}));

import SystemHealthPage from '../(dashboard)/system-health/page';

describe('SystemHealthPage', () => {
  it('should render skeleton initially while loading', () => {
    render(<SystemHealthPage />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render the System Health heading after data loads', async () => {
    render(<SystemHealthPage />);
    expect(await screen.findByText('System Health')).toBeInTheDocument();
  });

  it('should render the subtitle text after data loads', async () => {
    render(<SystemHealthPage />);
    expect(await screen.findByText('Monitor system status and performance')).toBeInTheDocument();
  });

  it('should render the Refresh button after data loads', async () => {
    render(<SystemHealthPage />);
    expect(await screen.findByText('Refresh')).toBeInTheDocument();
  });
});
