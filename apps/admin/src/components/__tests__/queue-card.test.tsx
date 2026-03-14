import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('@dhanam/ui', () =>
  new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === '__esModule') return true;
        const tag = String(prop).toLowerCase();
        if (tag === 'button') {
          return ({ children, disabled, onClick, ...props }: any) => (
            <button data-testid={tag} disabled={disabled} onClick={onClick} {...props}>
              {children}
            </button>
          );
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

jest.mock('@/lib/api/admin', () => ({
  adminApi: {
    retryFailedJobs: jest.fn().mockResolvedValue({ retriedCount: 2 }),
    clearQueue: jest.fn().mockResolvedValue({ clearedCount: 5 }),
  },
}));

import { QueueCard } from '../queue-card';
import type { QueueInfo } from '@/lib/api/admin';
import { adminApi } from '@/lib/api/admin';

const activeQueue: QueueInfo = {
  name: 'transaction-sync',
  status: 'active',
  recentJobs: 42,
  failedJobs: 3,
};

const cleanQueue: QueueInfo = {
  name: 'email-notifications',
  status: 'idle',
  recentJobs: 100,
  failedJobs: 0,
};

describe('QueueCard', () => {
  const onRefresh = jest.fn();

  beforeEach(() => {
    onRefresh.mockClear();
    (adminApi.retryFailedJobs as jest.Mock).mockClear();
  });

  it('renders the queue name', () => {
    render(<QueueCard queue={activeQueue} onRefresh={onRefresh} />);

    expect(screen.getByText('transaction-sync')).toBeInTheDocument();
  });

  it('shows job counts for recent and failed jobs', () => {
    render(<QueueCard queue={activeQueue} onRefresh={onRefresh} />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Recent Jobs')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('disables Retry Failed button when there are no failed jobs', () => {
    render(<QueueCard queue={cleanQueue} onRefresh={onRefresh} />);

    const retryButton = screen.getByText('Retry Failed').closest('button');
    expect(retryButton).toBeDisabled();
  });

  it('calls onRefresh after retrying failed jobs', async () => {
    render(<QueueCard queue={activeQueue} onRefresh={onRefresh} />);

    const retryButton = screen.getByText('Retry Failed').closest('button')!;
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(adminApi.retryFailedJobs).toHaveBeenCalledWith('transaction-sync');
      expect(onRefresh).toHaveBeenCalled();
    });
  });
});
