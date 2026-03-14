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
    searchAuditLogs: jest.fn().mockResolvedValue({ data: [], totalPages: 1 }),
  },
}));

import AuditLogsPage from '../../(dashboard)/audit-logs/page';

describe('AuditLogsPage', () => {
  it('should render the Audit Logs heading', () => {
    render(<AuditLogsPage />);
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
  });

  it('should render the subtitle text', () => {
    render(<AuditLogsPage />);
    expect(screen.getByText('View system activity and security events')).toBeInTheDocument();
  });

  it('should render the User ID filter input', () => {
    render(<AuditLogsPage />);
    expect(screen.getByPlaceholderText('User ID')).toBeInTheDocument();
  });

  it('should render date filter inputs', () => {
    render(<AuditLogsPage />);
    const dateInputs = screen.getAllByTestId('input');
    // User ID input + 2 date inputs = at least 3 inputs rendered via the proxy
    expect(dateInputs.length).toBeGreaterThanOrEqual(3);
  });

  it('should render the Search button', () => {
    render(<AuditLogsPage />);
    expect(screen.getByText('Search')).toBeInTheDocument();
  });
});
