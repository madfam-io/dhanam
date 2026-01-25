import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api';

import { useSpaces } from '../useSpaces';

// Types
export type GoalType =
  | 'monthly_spending'
  | 'target_balance'
  | 'weekly_spending'
  | 'percentage_income';

export interface CategoryAllocationStatus {
  categoryId: string;
  categoryName: string;
  budgetedAmount: number;
  carryoverAmount: number;
  allocated: number;
  spent: number;
  available: number;
  goalProgress?: number;
  isOverspent: boolean;
  goalType?: string;
  goalTarget?: number;
}

export interface IncomeEventSummary {
  id: string;
  amount: number;
  source: string;
  receivedAt: string;
  isAllocated: boolean;
}

export interface AllocationStatus {
  month: string;
  totalIncome: number;
  totalAllocated: number;
  unallocated: number;
  totalSpent: number;
  isFullyAllocated: boolean;
  categories: CategoryAllocationStatus[];
  incomeEvents: IncomeEventSummary[];
}

export interface CreateIncomeEventDto {
  amount: number;
  currency: string;
  source: string;
  description?: string;
  receivedAt: string;
}

export interface AllocateFundsDto {
  incomeEventId?: string;
  categoryId: string;
  amount: number;
  notes?: string;
}

export interface MoveFundsDto {
  fromCategoryId: string;
  toCategoryId: string;
  amount: number;
  notes?: string;
}

const QUERY_KEY = 'zero-based';

export function useAllocationStatus(month: string) {
  const { currentSpace } = useSpaces();

  return useQuery<AllocationStatus>({
    queryKey: [QUERY_KEY, 'allocation', currentSpace?.id, month],
    queryFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.get(
        `/zero-based/allocation?spaceId=${currentSpace.id}&month=${month}`
      );
      return response.data;
    },
    enabled: !!currentSpace && !!month,
  });
}

export function useCreateIncomeEvent() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (dto: CreateIncomeEventDto) => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.post(`/zero-based/income`, {
        ...dto,
        spaceId: currentSpace.id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'allocation', currentSpace?.id] });
    },
  });
}

export function useAllocateFunds() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (dto: AllocateFundsDto) => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.post(`/zero-based/allocate`, {
        ...dto,
        spaceId: currentSpace.id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'allocation', currentSpace?.id] });
    },
  });
}

export function useMoveFunds() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (dto: MoveFundsDto) => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.post(`/zero-based/move`, {
        ...dto,
        spaceId: currentSpace.id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'allocation', currentSpace?.id] });
    },
  });
}

export function useAutoAllocate() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.post(`/zero-based/auto-allocate`, {
        spaceId: currentSpace.id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'allocation', currentSpace?.id] });
    },
  });
}
