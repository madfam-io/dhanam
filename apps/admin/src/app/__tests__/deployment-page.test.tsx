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
    getSystemHealth: jest.fn(),
    getQueues: jest.fn(),
    getProviders: jest.fn(),
    getFeatureFlags: jest.fn(),
    getBillingEvents: jest.fn(),
    getDeploymentStatus: jest.fn().mockResolvedValue({
      version: '1.2.0',
      environment: 'production',
      commitSha: 'abc123',
      deployedAt: '2026-03-10T00:00:00Z',
    }),
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

jest.mock('@/components/deployment-status', () => ({
  DeploymentStatusCard: ({ status }: any) => (
    <div data-testid="deployment-status-card">
      <span>{status?.version}</span>
      <span>{status?.environment}</span>
    </div>
  ),
}));

import DeploymentPage from '../(dashboard)/deployment/page';

describe('DeploymentPage', () => {
  it('should render skeleton initially while loading', () => {
    render(<DeploymentPage />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render the Deployment Status heading after data loads', async () => {
    render(<DeploymentPage />);
    expect(await screen.findByText('Deployment Status')).toBeInTheDocument();
  });

  it('should render the deployment status card after data loads', async () => {
    render(<DeploymentPage />);
    expect(await screen.findByTestId('deployment-status-card')).toBeInTheDocument();
  });
});
