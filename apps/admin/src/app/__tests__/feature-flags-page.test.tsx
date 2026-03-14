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
  },
}));

let mockUseAdmin: () => any;

jest.mock('@/contexts/AdminContext', () => ({
  useAdmin: () => mockUseAdmin(),
}));

import FeatureFlagsPage from '../(dashboard)/feature-flags/page';

describe('FeatureFlagsPage', () => {
  beforeEach(() => {
    mockUseAdmin = () => ({
      featureFlags: [
        {
          key: 'dark_mode',
          name: 'Dark Mode',
          description: 'Enable dark mode for users',
          enabled: true,
          rolloutPercentage: 100,
          targetedUsers: [],
          updatedAt: '2026-01-15T00:00:00Z',
        },
        {
          key: 'new_dashboard',
          name: 'New Dashboard',
          description: 'Redesigned dashboard layout',
          enabled: false,
          rolloutPercentage: 25,
          targetedUsers: ['user-1'],
          updatedAt: '2026-02-01T00:00:00Z',
        },
      ],
      isLoading: false,
      updateFeatureFlag: jest.fn(),
    });
  });

  it('should render the Feature Flags heading', () => {
    render(<FeatureFlagsPage />);
    expect(screen.getByText('Feature Flags')).toBeInTheDocument();
  });

  it('should render the subtitle text', () => {
    render(<FeatureFlagsPage />);
    expect(screen.getByText('Manage feature rollouts and experiments')).toBeInTheDocument();
  });

  it('should render feature flag names', () => {
    render(<FeatureFlagsPage />);
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByText('New Dashboard')).toBeInTheDocument();
  });

  it('should render skeleton when loading', () => {
    mockUseAdmin = () => ({
      featureFlags: [],
      isLoading: true,
      updateFeatureFlag: jest.fn(),
    });

    render(<FeatureFlagsPage />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
