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

import { ProviderStatusTable } from '../provider-status-table';
import type { ProviderHealth } from '@/lib/api/admin';

const providers: ProviderHealth[] = [
  { name: 'belvo', status: 'healthy', accountCount: 42, lastSyncAt: '2026-03-14T08:00:00Z' },
  { name: 'plaid', status: 'degraded', accountCount: 18, lastSyncAt: '2026-03-13T22:30:00Z' },
  { name: 'bitso', status: 'down', accountCount: 7, lastSyncAt: null },
];

describe('ProviderStatusTable', () => {
  it('renders provider names', () => {
    render(<ProviderStatusTable providers={providers} />);

    expect(screen.getByText('belvo')).toBeInTheDocument();
    expect(screen.getByText('plaid')).toBeInTheDocument();
    expect(screen.getByText('bitso')).toBeInTheDocument();
  });

  it('shows status badges for each provider', () => {
    render(<ProviderStatusTable providers={providers} />);

    expect(screen.getByText('healthy')).toBeInTheDocument();
    expect(screen.getByText('degraded')).toBeInTheDocument();
    expect(screen.getByText('down')).toBeInTheDocument();
  });

  it('shows account counts for each provider', () => {
    render(<ProviderStatusTable providers={providers} />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('shows empty state when no providers are passed', () => {
    render(<ProviderStatusTable providers={[]} />);

    expect(screen.getByText('No provider data available')).toBeInTheDocument();
  });
});
