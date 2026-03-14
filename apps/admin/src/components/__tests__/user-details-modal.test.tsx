import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('@dhanam/ui', () =>
  new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === '__esModule') return true;
        const tag = String(prop).toLowerCase();
        if (tag === 'dialog') {
          return ({ children, ...props }: any) => (
            <div data-testid={tag} {...props}>
              {children}
            </div>
          );
        }
        if (tag === 'separator') {
          return (props: any) => <hr data-testid={tag} {...props} />;
        }
        return ({ children, className, ...props }: any) => (
          <div data-testid={tag} className={className} {...props}>
            {children}
          </div>
        );
      },
    }
  )
);

jest.mock('lucide-react', () =>
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

import { UserDetailsModal } from '../user-details-modal';
import type { UserDetails } from '@/lib/api/admin';

const mockUser: UserDetails = {
  id: 'user-1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  emailVerified: true,
  totpEnabled: true,
  locale: 'en',
  timezone: 'America/New_York',
  createdAt: '2025-01-15T00:00:00.000Z',
  updatedAt: '2025-06-01T00:00:00.000Z',
  lastActivity: '2025-06-01T12:00:00.000Z',
  spaces: [
    {
      id: 'space-1',
      name: 'Personal Finance',
      type: 'personal',
      role: 'owner',
      createdAt: '2025-01-15T00:00:00.000Z',
    },
    {
      id: 'space-2',
      name: 'Business LLC',
      type: 'business',
      role: 'admin',
      createdAt: '2025-03-01T00:00:00.000Z',
    },
  ],
  accountsCount: 5,
  transactionsCount: 1250,
};

describe('UserDetailsModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  it('renders the user name and email', () => {
    render(<UserDetailsModal user={mockUser} onClose={onClose} />);

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('shows the Email Verified badge when email is verified', () => {
    render(<UserDetailsModal user={mockUser} onClose={onClose} />);

    expect(screen.getByText('Email Verified')).toBeInTheDocument();
  });

  it('shows the 2FA Enabled badge when TOTP is enabled', () => {
    render(<UserDetailsModal user={mockUser} onClose={onClose} />);

    expect(screen.getByText('2FA Enabled')).toBeInTheDocument();
  });

  it('lists all connected spaces with their names', () => {
    render(<UserDetailsModal user={mockUser} onClose={onClose} />);

    expect(screen.getByText('Personal Finance')).toBeInTheDocument();
    expect(screen.getByText('Business LLC')).toBeInTheDocument();
    expect(screen.getByText(/Spaces \(2\)/)).toBeInTheDocument();
  });

  it('shows account and transaction counts', () => {
    render(<UserDetailsModal user={mockUser} onClose={onClose} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Connected Accounts')).toBeInTheDocument();
    expect(screen.getByText('1250')).toBeInTheDocument();
    expect(screen.getByText('Total Transactions')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    render(<UserDetailsModal user={mockUser} onClose={onClose} />);

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
