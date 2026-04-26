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
  },
}));

jest.mock('@/components/compliance-actions', () => ({
  ComplianceActions: () => (
    <div data-testid="compliance-actions">
      <div data-testid="gdpr-section">GDPR Export &amp; Deletion</div>
      <div data-testid="retention-section">Data Retention</div>
    </div>
  ),
}));

import CompliancePage from '../(dashboard)/compliance/page';

describe('CompliancePage', () => {
  it('should render the Compliance heading', () => {
    render(<CompliancePage />);
    expect(screen.getByText('Compliance')).toBeInTheDocument();
  });

  it('should render the subtitle text', () => {
    render(<CompliancePage />);
    expect(
      screen.getByText('GDPR data export and deletion, data retention policy execution')
    ).toBeInTheDocument();
  });

  it('should render the ComplianceActions component', () => {
    render(<CompliancePage />);
    expect(screen.getByTestId('compliance-actions')).toBeInTheDocument();
  });

  it('should show GDPR section', () => {
    render(<CompliancePage />);
    expect(screen.getByTestId('gdpr-section')).toBeInTheDocument();
  });

  it('should show data retention section', () => {
    render(<CompliancePage />);
    expect(screen.getByTestId('retention-section')).toBeInTheDocument();
  });
});
