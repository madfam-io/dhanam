import { render, screen, fireEvent } from '@testing-library/react';
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

import type { SpaceInfo } from '@/lib/api/admin';

import { SpaceDetailsModal } from '../space-details-modal';

function buildSpace(overrides: Partial<SpaceInfo> = {}): SpaceInfo {
  return {
    id: 'space-001',
    name: 'Acme Corp',
    type: 'business',
    currency: 'USD',
    createdAt: '2025-06-15T10:00:00Z',
    members: [
      { id: 'u1', name: 'Alice', email: 'alice@acme.com', role: 'owner' },
      { id: 'u2', name: 'Bob', email: 'bob@acme.com', role: 'member' },
    ],
    accountCount: 5,
    budgetCount: 3,
    ...overrides,
  };
}

describe('SpaceDetailsModal', () => {
  it('renders the space name and type badge', () => {
    render(<SpaceDetailsModal space={buildSpace()} onClose={jest.fn()} />);

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('business')).toBeInTheDocument();
  });

  it('displays the currency badge', () => {
    render(<SpaceDetailsModal space={buildSpace({ currency: 'MXN' })} onClose={jest.fn()} />);

    expect(screen.getByText('MXN')).toBeInTheDocument();
  });

  it('lists all members with name, email, and role', () => {
    render(<SpaceDetailsModal space={buildSpace()} onClose={jest.fn()} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@acme.com')).toBeInTheDocument();
    expect(screen.getByText('owner')).toBeInTheDocument();

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('bob@acme.com')).toBeInTheDocument();
    expect(screen.getByText('member')).toBeInTheDocument();
  });

  it('shows account and budget counts', () => {
    render(<SpaceDetailsModal space={buildSpace()} onClose={jest.fn()} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Budgets')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    render(<SpaceDetailsModal space={buildSpace()} onClose={onClose} />);

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
