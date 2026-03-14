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
    getOnboardingFunnel: jest.fn().mockResolvedValue({
      total: 1000,
      completion: { rate: 65.5, averageTimeMinutes: 12 },
      steps: [
        { step: 'sign_up', count: 1000, percentage: 100 },
        { step: 'email_verification', count: 850, percentage: 85 },
        { step: 'space_setup', count: 700, percentage: 70 },
        { step: 'connect_accounts', count: 600, percentage: 60 },
        { step: 'first_budget', count: 550, percentage: 55 },
        { step: 'onboarding_complete', count: 500, percentage: 50 },
      ],
      dropoff: [
        { fromStep: 'sign_up', toStep: 'email_verification', count: 150, percentage: 15 },
        { fromStep: 'email_verification', toStep: 'space_setup', count: 150, percentage: 17.6 },
        { fromStep: 'space_setup', toStep: 'connect_accounts', count: 100, percentage: 14.3 },
        { fromStep: 'connect_accounts', toStep: 'first_budget', count: 50, percentage: 8.3 },
        { fromStep: 'first_budget', toStep: 'onboarding_complete', count: 50, percentage: 9.1 },
      ],
    }),
  },
}));

import AnalyticsPage from '../(dashboard)/analytics/page';

describe('AnalyticsPage', () => {
  it('should render skeleton initially while loading', () => {
    render(<AnalyticsPage />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render the Analytics heading after data loads', async () => {
    render(<AnalyticsPage />);
    expect(await screen.findByText('Analytics')).toBeInTheDocument();
  });

  it('should render the Onboarding Funnel section after data loads', async () => {
    render(<AnalyticsPage />);
    expect(await screen.findByText('Onboarding Funnel')).toBeInTheDocument();
  });
});
