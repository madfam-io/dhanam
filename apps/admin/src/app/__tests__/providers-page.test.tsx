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
    getProviderHealth: jest.fn().mockResolvedValue({
      providers: [
        { name: 'belvo', status: 'healthy', latency: 120 },
        { name: 'plaid', status: 'healthy', latency: 95 },
      ],
    }),
  },
}));

jest.mock('@/components/provider-status-table', () => ({
  ProviderStatusTable: ({ providers }: any) => (
    <div data-testid="provider-status-table">
      {providers?.map((p: any) => (
        <span key={p.name}>{p.name}</span>
      ))}
    </div>
  ),
}));

import ProvidersPage from '../../(dashboard)/providers/page';

describe('ProvidersPage', () => {
  it('should render skeleton initially while loading', () => {
    render(<ProvidersPage />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render the Provider Health heading after data loads', async () => {
    render(<ProvidersPage />);
    expect(await screen.findByText('Provider Health')).toBeInTheDocument();
  });

  it('should render the subtitle text after data loads', async () => {
    render(<ProvidersPage />);
    expect(
      await screen.findByText('Monitor financial data provider connections and rate limits'),
    ).toBeInTheDocument();
  });

  it('should render the provider status table after data loads', async () => {
    render(<ProvidersPage />);
    expect(await screen.findByTestId('provider-status-table')).toBeInTheDocument();
  });
});
