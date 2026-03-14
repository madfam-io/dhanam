import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('@dhanam/ui', () =>
  new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === '__esModule') return true;
        return ({ children, ...props }: any) => (
          <button data-testid={String(prop).toLowerCase()} {...props}>
            {children}
          </button>
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

const mockLogout = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/hooks/use-admin-auth', () => ({
  useAdminAuth: () => ({
    user: { id: '1', email: 'admin@test.com', name: 'Admin' },
    logout: mockLogout,
  }),
}));

import { AdminHeader } from '../admin-header';

describe('AdminHeader', () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  it('renders the Admin Dashboard title', () => {
    render(<AdminHeader />);

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('shows the authenticated user email', () => {
    render(<AdminHeader />);

    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
  });

  it('has a logout button', () => {
    render(<AdminHeader />);

    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('has a Back to App link', () => {
    render(<AdminHeader />);

    expect(screen.getByText('Back to App')).toBeInTheDocument();
  });
});
