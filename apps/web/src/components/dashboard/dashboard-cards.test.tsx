import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardCards } from './dashboard-cards';

// Mock the API hooks
jest.mock('@/lib/api/spaces', () => ({
  spacesApi: {
    getOverview: jest.fn(),
  },
}));

jest.mock('@/lib/api/analytics', () => ({
  analyticsApi: {
    getNetWorthTrend: jest.fn(),
    getCashFlowForecast: jest.fn(),
  },
}));

// Mock Recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const mockSpaceOverview = {
  totalBalance: 10000,
  totalIncome: 5000,
  totalExpenses: 3000,
  netCashflow: 2000,
  accountsCount: 3,
  transactionsCount: 25,
  lastSyncedAt: '2024-01-15T10:00:00Z',
};

const mockNetWorthTrend = [
  { date: '2024-01-01', value: 8000 },
  { date: '2024-01-08', value: 9000 },
  { date: '2024-01-15', value: 10000 },
];

const mockCashFlowForecast = [
  { date: '2024-01-22', income: 2000, expenses: 1500, net: 500 },
  { date: '2024-01-29', income: 2000, expenses: 1600, net: 400 },
];

describe('DashboardCards', () => {
  beforeEach(() => {
    const { spacesApi } = require('@/lib/api/spaces');
    const { analyticsApi } = require('@/lib/api/analytics');
    
    spacesApi.getOverview.mockResolvedValue(mockSpaceOverview);
    analyticsApi.getNetWorthTrend.mockResolvedValue(mockNetWorthTrend);
    analyticsApi.getCashFlowForecast.mockResolvedValue(mockCashFlowForecast);
  });

  it('should render dashboard cards with space data', async () => {
    render(<DashboardCards spaceId="test-space" currency="USD" />);

    // Check if cards are rendered
    expect(screen.getByText('Total Balance')).toBeInTheDocument();
    expect(screen.getByText('Net Cashflow')).toBeInTheDocument();
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
  });

  it('should display formatted currency values', async () => {
    render(<DashboardCards spaceId="test-space" currency="USD" />);

    // Wait for async data to load and check formatted values
    await screen.findByText('$10,000.00');
    await screen.findByText('$2,000.00');
  });

  it('should show account and transaction counts', async () => {
    render(<DashboardCards spaceId="test-space" currency="USD" />);

    await screen.findByText('3');
    await screen.findByText('25');
  });

  it('should render charts', async () => {
    render(<DashboardCards spaceId="test-space" currency="USD" />);

    // Check if chart components are rendered
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    const { spacesApi } = require('@/lib/api/spaces');
    spacesApi.getOverview.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<DashboardCards spaceId="test-space" currency="USD" />);

    // Should show loading indicators
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    const { spacesApi } = require('@/lib/api/spaces');
    spacesApi.getOverview.mockRejectedValue(new Error('API Error'));

    render(<DashboardCards spaceId="test-space" currency="USD" />);

    // Should show error message
    await screen.findByText('Failed to load dashboard data');
  });
});