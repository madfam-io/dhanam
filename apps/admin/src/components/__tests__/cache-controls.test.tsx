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

jest.mock('@/lib/api/admin', () => ({
  adminApi: {
    flushCache: jest.fn(),
  },
}));

import { CacheControls } from '../cache-controls';

describe('CacheControls', () => {
  it('renders the pattern input field', () => {
    render(<CacheControls />);

    const input = screen.getByPlaceholderText('Redis key pattern (e.g. admin:*)');
    expect(input).toBeInTheDocument();
  });

  it('renders preset buttons', () => {
    render(<CacheControls />);

    expect(screen.getByText('System Stats')).toBeInTheDocument();
    expect(screen.getByText('All Admin Cache')).toBeInTheDocument();
    expect(screen.getByText('Session Cache')).toBeInTheDocument();
    expect(screen.getByText('Feature Flags')).toBeInTheDocument();
  });

  it('renders the flush button', () => {
    render(<CacheControls />);

    expect(screen.getByText('Flush')).toBeInTheDocument();
  });
});
