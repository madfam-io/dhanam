import React from 'react';
import { render, screen } from '@testing-library/react';

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
    getDeploymentStatus: jest.fn(),
    getSpaces: jest.fn(),
    gdprExport: jest.fn(),
    gdprDelete: jest.fn(),
    executeRetention: jest.fn(),
    retryFailedJobs: jest.fn(),
    clearQueue: jest.fn(),
    flushCache: jest.fn(),
    toggleFeatureFlag: jest.fn(),
    getQueueStats: jest.fn().mockResolvedValue({ queues: [] }),
  },
}));

jest.mock('@/components/queue-card', () => ({
  QueueCard: ({ queue }: any) => <div data-testid="queue-card">{queue.name}</div>,
}));

import QueuesPage from '../(dashboard)/queues/page';

describe('QueuesPage', () => {
  it('should render the Queue Management heading', async () => {
    render(<QueuesPage />);
    expect(await screen.findByText('Queue Management')).toBeInTheDocument();
  });

  it('should render the subtitle text', async () => {
    render(<QueuesPage />);
    expect(await screen.findByText('BullMQ queue stats and actions')).toBeInTheDocument();
  });

  it('should render the Refresh button', async () => {
    render(<QueuesPage />);
    expect(await screen.findByText('Refresh')).toBeInTheDocument();
  });

  it('should show empty state when no queues available', async () => {
    render(<QueuesPage />);
    expect(await screen.findByText('No queue data available')).toBeInTheDocument();
  });
});
