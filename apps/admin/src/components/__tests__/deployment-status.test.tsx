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

import type { DeploymentStatus } from '@/lib/api/admin';

import { DeploymentStatusCard } from '../deployment-status';

const status: DeploymentStatus = {
  version: '2.4.1',
  commitSha: 'a1b2c3d4e5f6g7h8',
  buildTime: '2026-03-14T12:00:00Z',
  nodeVersion: 'v20.11.0',
  environment: 'production',
};

describe('DeploymentStatusCard', () => {
  it('renders the version number', () => {
    render(<DeploymentStatusCard status={status} />);

    expect(screen.getByText('2.4.1')).toBeInTheDocument();
  });

  it('shows the first 8 characters of the commit SHA', () => {
    render(<DeploymentStatusCard status={status} />);

    expect(screen.getByText('a1b2c3d4')).toBeInTheDocument();
  });

  it('shows the environment badge', () => {
    render(<DeploymentStatusCard status={status} />);

    expect(screen.getByText('production')).toBeInTheDocument();
  });

  it('shows the node version', () => {
    render(<DeploymentStatusCard status={status} />);

    expect(screen.getByText('v20.11.0')).toBeInTheDocument();
  });
});
