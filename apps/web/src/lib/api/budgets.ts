import { apiClient } from './client';
import { Budget, BudgetPeriod } from '@dhanam/shared';

export interface CreateBudgetDto {
  name: string;
  period: BudgetPeriod;
  startDate: Date;
  endDate?: Date;
}

export interface UpdateBudgetDto {
  name?: string;
  period?: BudgetPeriod;
  startDate?: Date;
  endDate?: Date;
}

export interface CategorySummary {
  id: string;
  budgetId: string;
  name: string;
  budgetedAmount: number;
  icon: string | null;
  color: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    transactions: number;
  };
  spent: number;
  remaining: number;
  percentUsed: number;
  transactionCount: number;
}

export interface BudgetSummary extends Budget {
  categories: CategorySummary[];
  summary: {
    totalBudgeted: number;
    totalSpent: number;
    totalRemaining: number;
    totalPercentUsed: number;
  };
}

export const budgetsApi = {
  getBudgets: async (spaceId: string): Promise<Budget[]> => {
    return apiClient.get<Budget[]>(`/spaces/${spaceId}/budgets`);
  },

  getBudget: async (spaceId: string, budgetId: string): Promise<Budget> => {
    return apiClient.get<Budget>(`/spaces/${spaceId}/budgets/${budgetId}`);
  },

  getBudgetSummary: async (spaceId: string, budgetId: string): Promise<BudgetSummary> => {
    return apiClient.get<BudgetSummary>(`/spaces/${spaceId}/budgets/${budgetId}/summary`);
  },

  createBudget: async (spaceId: string, dto: CreateBudgetDto): Promise<Budget> => {
    return apiClient.post<Budget>(`/spaces/${spaceId}/budgets`, dto);
  },

  updateBudget: async (
    spaceId: string,
    budgetId: string,
    dto: UpdateBudgetDto
  ): Promise<Budget> => {
    return apiClient.patch<Budget>(`/spaces/${spaceId}/budgets/${budgetId}`, dto);
  },

  deleteBudget: async (spaceId: string, budgetId: string): Promise<void> => {
    await apiClient.delete(`/spaces/${spaceId}/budgets/${budgetId}`);
  },

  getBudgetAnalytics: async (
    spaceId: string,
    budgetId: string
  ): Promise<Record<string, unknown>> => {
    return apiClient.get<Record<string, unknown>>(
      `/spaces/${spaceId}/budgets/${budgetId}/analytics`
    );
  },
};
