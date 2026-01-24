import { apiClient } from './client';
import {
  NetWorthResponse,
  CashflowForecast,
  SpendingByCategory,
  IncomeVsExpenses,
  AccountBalanceAnalytics,
  PortfolioAllocation,
  Account,
  Transaction,
  Budget,
} from '@dhanam/shared';
import type { Goal } from '@/hooks/useGoals';
import type { BudgetSummary } from './budgets';

export interface NetWorthHistoryPoint {
  date: string;
  netWorth: number;
  assets: number;
  liabilities: number;
}

export type OwnershipFilter = 'yours' | 'mine' | 'ours' | 'all';

export interface NetWorthByOwnership {
  yours: number;
  mine: number;
  ours: number;
  total: number;
  currency: string;
  breakdown: {
    category: OwnershipFilter;
    assets: number;
    liabilities: number;
    netWorth: number;
    accountCount: number;
  }[];
}

export interface AccountWithOwnership extends Account {
  ownershipCategory: 'yours' | 'mine' | 'ours';
}

export const analyticsApi = {
  /**
   * Get net worth analysis for a space
   */
  getNetWorth: async (spaceId: string): Promise<NetWorthResponse> => {
    return apiClient.get<NetWorthResponse>(`/analytics/${spaceId}/net-worth`);
  },

  /**
   * Get net worth history for charting
   */
  getNetWorthHistory: async (spaceId: string, days?: number): Promise<NetWorthHistoryPoint[]> => {
    const params = days ? { days: days.toString() } : {};
    return apiClient.get<NetWorthHistoryPoint[]>(`/analytics/${spaceId}/net-worth-history`, params);
  },

  /**
   * Get cashflow forecast for the next 60 days
   */
  getCashflowForecast: async (spaceId: string, days?: number): Promise<CashflowForecast> => {
    const params = days ? { days: days.toString() } : {};
    return apiClient.get<CashflowForecast>(`/analytics/${spaceId}/cashflow-forecast`, params);
  },

  /**
   * Get spending breakdown by category
   */
  getSpendingByCategory: async (
    spaceId: string,
    startDate?: string,
    endDate?: string
  ): Promise<SpendingByCategory[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return apiClient.get<SpendingByCategory[]>(
      `/analytics/${spaceId}/spending-by-category`,
      params
    );
  },

  /**
   * Get income vs expenses trend
   */
  getIncomeVsExpenses: async (spaceId: string, months?: number): Promise<IncomeVsExpenses[]> => {
    const params = months ? { months: months.toString() } : {};
    return apiClient.get<IncomeVsExpenses[]>(`/analytics/${spaceId}/income-vs-expenses`, params);
  },

  /**
   * Get account balances with analytics
   */
  getAccountBalances: async (spaceId: string): Promise<AccountBalanceAnalytics[]> => {
    return apiClient.get<AccountBalanceAnalytics[]>(`/analytics/${spaceId}/account-balances`);
  },

  /**
   * Get portfolio allocation breakdown
   */
  getPortfolioAllocation: async (spaceId: string): Promise<PortfolioAllocation[]> => {
    return apiClient.get<PortfolioAllocation[]>(`/analytics/${spaceId}/portfolio-allocation`);
  },

  /**
   * Get combined dashboard data in a single request
   * Reduces waterfall by returning all dashboard data at once
   */
  getDashboardData: async (spaceId: string): Promise<DashboardData> => {
    return apiClient.get<DashboardData>(`/analytics/${spaceId}/dashboard-data`);
  },

  /**
   * Get net worth breakdown by ownership (yours, mine, ours)
   * Used for household views where couples want to see individual vs joint assets
   */
  getNetWorthByOwnership: async (
    spaceId: string,
    currency?: string
  ): Promise<NetWorthByOwnership> => {
    const params = currency ? { currency } : {};
    return apiClient.get<NetWorthByOwnership>(
      `/analytics/${spaceId}/net-worth-by-ownership`,
      params
    );
  },

  /**
   * Get accounts filtered by ownership type
   */
  getAccountsByOwnership: async (
    spaceId: string,
    ownership?: OwnershipFilter
  ): Promise<AccountWithOwnership[]> => {
    const params = ownership ? { ownership } : {};
    return apiClient.get<AccountWithOwnership[]>(
      `/analytics/${spaceId}/accounts-by-ownership`,
      params
    );
  },
};

// Dashboard data type for combined endpoint
export interface DashboardData {
  accounts: Account[];
  recentTransactions: {
    data: Transaction[];
    total: number;
  };
  budgets: Budget[];
  currentBudgetSummary: BudgetSummary | null;
  netWorth: NetWorthResponse;
  cashflowForecast: CashflowForecast;
  portfolioAllocation: PortfolioAllocation[];
  goals: Goal[];
}
