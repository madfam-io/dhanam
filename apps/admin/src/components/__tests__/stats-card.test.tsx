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
          return ({ children, className, ...props }: any) => (
            <div data-testid={String(prop).toLowerCase()} className={className} {...props}>
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

import { StatsCard } from '../stats-card';

const FakeIcon = ((props: any) => <span data-testid="icon-fake" {...props} />) as any;

describe('StatsCard', () => {
  it('renders the title and value', () => {
    render(<StatsCard title="Total Users" value={1234} icon={FakeIcon} />);

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders the subtitle when provided', () => {
    render(
      <StatsCard title="Revenue" value="$50k" subtitle="+12% from last month" icon={FakeIcon} />
    );

    expect(screen.getByText('+12% from last month')).toBeInTheDocument();
  });

  it('renders without subtitle when not provided', () => {
    const { container } = render(<StatsCard title="Accounts" value={42} icon={FakeIcon} />);

    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    // Only title and value text paragraphs should exist, not a subtitle paragraph
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
  });

  it('applies the specified color class', () => {
    const { container } = render(
      <StatsCard title="Alerts" value={7} icon={FakeIcon} color="orange" />
    );

    const coloredDiv = container.querySelector('.bg-orange-100');
    expect(coloredDiv).toBeInTheDocument();
  });
});
