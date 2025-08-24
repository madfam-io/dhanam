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

export const budgetsApi = {
  getBudgets: async (spaceId: string): Promise<Budget[]> => {
    return apiClient.get<Budget[]>(`/spaces/${spaceId}/budgets`);
  },

  getBudget: async (spaceId: string, budgetId: string): Promise<Budget> => {
    return apiClient.get<Budget>(`/spaces/${spaceId}/budgets/${budgetId}`);
  },

  getBudgetSummary: async (spaceId: string, budgetId: string): Promise<any> => {
    return apiClient.get<any>(
      `/spaces/${spaceId}/budgets/${budgetId}/summary`,
    );
  },

  createBudget: async (
    spaceId: string,
    dto: CreateBudgetDto,
  ): Promise<Budget> => {
    return apiClient.post<Budget>(`/spaces/${spaceId}/budgets`, dto);
  },

  updateBudget: async (
    spaceId: string,
    budgetId: string,
    dto: UpdateBudgetDto,
  ): Promise<Budget> => {
    return apiClient.patch<Budget>(
      `/spaces/${spaceId}/budgets/${budgetId}`,
      dto,
    );
  },

  deleteBudget: async (spaceId: string, budgetId: string): Promise<void> => {
    await apiClient.delete(`/spaces/${spaceId}/budgets/${budgetId}`);
  },
};