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
    const response = await apiClient.get(`/spaces/${spaceId}/budgets`);
    return response.data;
  },

  getBudget: async (spaceId: string, budgetId: string): Promise<Budget> => {
    const response = await apiClient.get(`/spaces/${spaceId}/budgets/${budgetId}`);
    return response.data;
  },

  getBudgetSummary: async (spaceId: string, budgetId: string): Promise<any> => {
    const response = await apiClient.get(
      `/spaces/${spaceId}/budgets/${budgetId}/summary`,
    );
    return response.data;
  },

  createBudget: async (
    spaceId: string,
    dto: CreateBudgetDto,
  ): Promise<Budget> => {
    const response = await apiClient.post(`/spaces/${spaceId}/budgets`, dto);
    return response.data;
  },

  updateBudget: async (
    spaceId: string,
    budgetId: string,
    dto: UpdateBudgetDto,
  ): Promise<Budget> => {
    const response = await apiClient.patch(
      `/spaces/${spaceId}/budgets/${budgetId}`,
      dto,
    );
    return response.data;
  },

  deleteBudget: async (spaceId: string, budgetId: string): Promise<void> => {
    await apiClient.delete(`/spaces/${spaceId}/budgets/${budgetId}`);
  },
};