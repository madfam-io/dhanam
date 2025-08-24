import React from 'react';
import { render, screen } from '@testing-library/react';
import { BudgetAnalytics } from './budget-analytics';
import { Currency } from '@dhanam/shared';

// Mock the API hooks
jest.mock('@/lib/api/budgets', () => ({
  budgetsApi: {
    getBudgetAnalytics: jest.fn(),
  },
}));

// Mock Recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const mockBudgetAnalytics = {
  totalBudget: 3000,
  totalSpent: 2100,
  remainingBudget: 900,
  categories: [
    {
      id: 'cat1',
      name: 'Groceries',
      type: 'expense',
      limit: 500,
      spent: 350,
      remaining: 150,
      percentage: 70,
    },
    {
      id: 'cat2',
      name: 'Dining',
      type: 'expense',
      limit: 300,
      spent: 280,
      remaining: 20,
      percentage: 93.3,
    },
    {
      id: 'cat3',
      name: 'Transportation',
      type: 'expense',
      limit: 400,
      spent: 200,
      remaining: 200,
      percentage: 50,
    },
  ],
  insights: [
    'You are 93% through your Dining budget',
    'Transportation spending is well under control',
    'Consider reducing dining expenses this month',
  ],
  trends: [
    { month: 'Nov', spent: 1800 },
    { month: 'Dec', spent: 2000 },
    { month: 'Jan', spent: 2100 },
  ],
};

describe('BudgetAnalytics', () => {
  beforeEach(() => {
    const { budgetsApi } = require('@/lib/api/budgets');
    budgetsApi.getBudgetAnalytics.mockResolvedValue(mockBudgetAnalytics);
  });

  it('should render budget analytics with all sections', async () => {
    render(<BudgetAnalytics spaceId="test-space" budgetId="test-budget" currency={Currency.USD} />);

    // Check main sections
    expect(screen.getByText('Budget Overview')).toBeInTheDocument();
    expect(screen.getByText('Category Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Spending Trends')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
  });

  it('should display budget summary correctly', async () => {
    render(<BudgetAnalytics spaceId="test-space" budgetId="test-budget" currency={Currency.USD} />);

    // Wait for async data and check budget summary
    await screen.findByText('$3,000.00');
    await screen.findByText('$2,100.00');
    await screen.findByText('$900.00');
  });

  it('should show category spending details', async () => {
    render(<BudgetAnalytics spaceId="test-space" budgetId="test-budget" currency={Currency.USD} />);

    // Check category details
    await screen.findByText('Groceries');
    await screen.findByText('Dining');
    await screen.findByText('Transportation');

    await screen.findByText('70%');
    await screen.findByText('93%');
    await screen.findByText('50%');
  });

  it('should display insights', async () => {
    render(<BudgetAnalytics spaceId="test-space" budgetId="test-budget" currency={Currency.USD} />);

    // Check insights
    await screen.findByText('You are 93% through your Dining budget');
    await screen.findByText('Transportation spending is well under control');
    await screen.findByText('Consider reducing dining expenses this month');
  });

  it('should render charts', async () => {
    render(<BudgetAnalytics spaceId="test-space" budgetId="test-budget" currency={Currency.USD} />);

    // Check if chart components are rendered
    expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    const { budgetsApi } = require('@/lib/api/budgets');
    budgetsApi.getBudgetAnalytics.mockImplementation(() => new Promise(() => {}));

    render(<BudgetAnalytics spaceId="test-space" budgetId="test-budget" currency={Currency.USD} />);

    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    const { budgetsApi } = require('@/lib/api/budgets');
    budgetsApi.getBudgetAnalytics.mockRejectedValue(new Error('Analytics API Error'));

    render(<BudgetAnalytics spaceId="test-space" budgetId="test-budget" currency={Currency.USD} />);

    await screen.findByText('Failed to load budget analytics');
  });

  it('should highlight over-budget categories', async () => {
    const overBudgetAnalytics = {
      ...mockBudgetAnalytics,
      categories: [
        {
          id: 'cat1',
          name: 'Dining',
          type: 'expense',
          limit: 300,
          spent: 350,
          remaining: -50,
          percentage: 116.7,
        },
      ],
    };

    const { budgetsApi } = require('@/lib/api/budgets');
    budgetsApi.getBudgetAnalytics.mockResolvedValue(overBudgetAnalytics);

    render(<BudgetAnalytics spaceId="test-space" budgetId="test-budget" currency={Currency.USD} />);

    // Should show over-budget indicator
    await screen.findByText('117%'); // Rounded percentage
    expect(screen.getByText('Over Budget')).toBeInTheDocument();
  });
});
