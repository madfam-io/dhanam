import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@dhanam/ui', () =>
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

import { HealthStatusCard } from '../health-status-card';

const healthyServices = [
  { name: 'Database', status: 'healthy' },
  { name: 'Redis', status: 'healthy' },
  { name: 'Queue Worker', status: 'active' },
];

const mixedServices = [
  { name: 'Database', status: 'healthy' },
  { name: 'Redis', status: 'degraded', detail: 'High memory' },
  { name: 'External API', status: 'down', detail: 'Connection refused' },
];

describe('HealthStatusCard', () => {
  it('renders all service names', () => {
    render(<HealthStatusCard services={healthyServices} />);

    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Redis')).toBeInTheDocument();
    expect(screen.getByText('Queue Worker')).toBeInTheDocument();
  });

  it('shows status badges for each service', () => {
    render(<HealthStatusCard services={mixedServices} />);

    expect(screen.getByText('healthy')).toBeInTheDocument();
    expect(screen.getByText('degraded')).toBeInTheDocument();
    expect(screen.getByText('down')).toBeInTheDocument();
  });

  it('displays uptime when provided', () => {
    // 90061 seconds = 1d 1h 1m
    render(<HealthStatusCard services={healthyServices} uptime={90061} />);

    expect(screen.getByText('Uptime: 1d 1h 1m')).toBeInTheDocument();
  });

  it('shows "All Systems Operational" when all services are healthy/active/idle', () => {
    render(<HealthStatusCard services={healthyServices} />);

    expect(screen.getByText('All Systems Operational')).toBeInTheDocument();
  });

  it('shows "Issues Detected" when any service is degraded or down', () => {
    render(<HealthStatusCard services={mixedServices} />);

    expect(screen.getByText('Issues Detected')).toBeInTheDocument();
  });

  it('displays service detail text when provided', () => {
    render(<HealthStatusCard services={mixedServices} />);

    expect(screen.getByText('High memory')).toBeInTheDocument();
    expect(screen.getByText('Connection refused')).toBeInTheDocument();
  });
});
