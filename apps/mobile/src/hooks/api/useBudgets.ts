import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api';

import { useSpaces } from '../useSpaces';

export interface BudgetCategory {
  id: string;
  name: string;
  cap: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  color?: string;
  icon?: string;
}

export interface Budget {
  id: string;
  name: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  totalBudget: number;
  totalSpent: number;
  categories: BudgetCategory[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetDto {
  name: string;
  period: Budget['period'];
  categories: Array<{
    name: string;
    cap: number;
    color?: string;
    icon?: string;
  }>;
  startDate?: string;
}

export interface UpdateBudgetDto {
  name?: string;
  categories?: Array<{
    id?: string;
    name: string;
    cap: number;
    color?: string;
    icon?: string;
  }>;
}

const QUERY_KEY = 'budgets';

export function useBudgets() {
  const { currentSpace } = useSpaces();

  return useQuery<Budget[]>({
    queryKey: [QUERY_KEY, currentSpace?.id],
    queryFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.get(`/budgets?spaceId=${currentSpace.id}`);
      return response.data;
    },
    enabled: !!currentSpace,
  });
}

export function useBudget(budgetId: string) {
  return useQuery<Budget>({
    queryKey: [QUERY_KEY, budgetId],
    queryFn: async () => {
      const response = await apiClient.get(`/budgets/${budgetId}`);
      return response.data;
    },
    enabled: !!budgetId,
  });
}

export function useActiveBudget() {
  const { currentSpace } = useSpaces();

  return useQuery<Budget | null>({
    queryKey: [QUERY_KEY, 'active', currentSpace?.id],
    queryFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.get(`/budgets/active?spaceId=${currentSpace.id}`);
      return response.data;
    },
    enabled: !!currentSpace,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (data: CreateBudgetDto) => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.post('/budgets', {
        ...data,
        spaceId: currentSpace.id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'active', currentSpace?.id] });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBudgetDto }) => {
      const response = await apiClient.patch(`/budgets/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'active', currentSpace?.id] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'active', currentSpace?.id] });
    },
  });
}

export function useBudgetProgress() {
  const { currentSpace } = useSpaces();

  return useQuery<{
    totalBudget: number;
    totalSpent: number;
    percentUsed: number;
    daysRemaining: number;
    projectedSpend: number;
    status: 'on_track' | 'over_budget' | 'under_budget';
  }>({
    queryKey: [QUERY_KEY, 'progress', currentSpace?.id],
    queryFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.get(`/budgets/progress?spaceId=${currentSpace.id}`);
      return response.data;
    },
    enabled: !!currentSpace,
  });
}
