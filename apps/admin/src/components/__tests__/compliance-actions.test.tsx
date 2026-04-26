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
          const name = String(prop);
          // Input must render as <input> so fireEvent.change and toHaveValue work
          if (name === 'Input') {
            return (props: any) => <input data-testid="input" {...props} />;
          }
          return ({ children, ...props }: any) => (
            <div data-testid={name.toLowerCase()} {...props}>
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

jest.mock('@/lib/api/admin', () => ({
  adminApi: {
    gdprExport: jest.fn(),
    gdprDelete: jest.fn(),
    executeRetention: jest.fn(),
  },
}));

import { ComplianceActions } from '../compliance-actions';

describe('ComplianceActions', () => {
  it('renders the user ID input field', () => {
    render(<ComplianceActions />);

    const input = screen.getByPlaceholderText('User ID');
    expect(input).toBeInTheDocument();
  });

  it('renders Export Data and Delete Data buttons', () => {
    render(<ComplianceActions />);

    expect(screen.getByText('Export Data')).toBeInTheDocument();
    expect(screen.getByText('Delete Data')).toBeInTheDocument();
  });

  it('renders the Execute Retention Policies button', () => {
    render(<ComplianceActions />);

    expect(screen.getByText('Execute Retention Policies')).toBeInTheDocument();
  });

  it('accepts text input in the user ID field', () => {
    render(<ComplianceActions />);

    const input = screen.getByPlaceholderText('User ID');
    fireEvent.change(input, { target: { value: 'user-abc-123' } });

    expect(input).toHaveValue('user-abc-123');
  });

  it('renders section headings for GDPR Actions and Data Retention', () => {
    render(<ComplianceActions />);

    expect(screen.getByText('GDPR Actions')).toBeInTheDocument();
    expect(screen.getByText('Data Retention')).toBeInTheDocument();
  });
});
