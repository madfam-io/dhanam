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
    getDeploymentStatus: jest.fn(),
    getSpaces: jest.fn(),
    gdprExport: jest.fn(),
    gdprDelete: jest.fn(),
    executeRetention: jest.fn(),
    retryFailedJobs: jest.fn(),
    clearQueue: jest.fn(),
    flushCache: jest.fn(),
    toggleFeatureFlag: jest.fn(),
    searchUsers: jest.fn().mockResolvedValue({ data: [], totalPages: 1 }),
    getUserDetails: jest.fn(),
  },
}));

jest.mock('@/components/user-details-modal', () => ({
  UserDetailsModal: () => <div data-testid="user-details-modal" />,
}));

import UsersPage from '../(dashboard)/users/page';

describe('UsersPage', () => {
  it('should render the Users heading', () => {
    render(<UsersPage />);
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('should render the subtitle text', () => {
    render(<UsersPage />);
    expect(screen.getByText('Search and manage user accounts')).toBeInTheDocument();
  });

  it('should render a search input', () => {
    render(<UsersPage />);
    expect(screen.getByPlaceholderText('Search by email or name...')).toBeInTheDocument();
  });

  it('should render the Search button', () => {
    render(<UsersPage />);
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('should render user table column headers', () => {
    render(<UsersPage />);
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Spaces')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
