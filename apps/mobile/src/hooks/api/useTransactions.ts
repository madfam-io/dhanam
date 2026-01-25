import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';

import { apiClient } from '@/services/api';

import { useSpaces } from '../useSpaces';

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  accountId: string;
  accountName: string;
  provider: string;
  pending: boolean;
  tags?: string[];
  notes?: string;
  merchant?: {
    name: string;
    logo?: string;
    category?: string;
  };
}

export interface TransactionFilters {
  type?: 'income' | 'expense' | 'transfer';
  search?: string;
  category?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  pending?: boolean;
}

export interface UpdateTransactionDto {
  category?: string;
  tags?: string[];
  notes?: string;
}

const QUERY_KEY = 'transactions';

export function useTransactions(
  filters?: TransactionFilters,
  options?: Omit<UseQueryOptions<Transaction[]>, 'queryKey' | 'queryFn'>
) {
  const { currentSpace } = useSpaces();

  return useQuery<Transaction[]>({
    queryKey: [QUERY_KEY, currentSpace?.id, filters],
    queryFn: async () => {
      if (!currentSpace) throw new Error('No space selected');

      const params = new URLSearchParams({ spaceId: currentSpace.id });

      if (filters) {
        if (filters.type) params.append('type', filters.type);
        if (filters.search) params.append('search', filters.search);
        if (filters.category) params.append('category', filters.category);
        if (filters.accountId) params.append('accountId', filters.accountId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.minAmount !== undefined) params.append('minAmount', String(filters.minAmount));
        if (filters.maxAmount !== undefined) params.append('maxAmount', String(filters.maxAmount));
        if (filters.pending !== undefined) params.append('pending', String(filters.pending));
      }

      const response = await apiClient.get(`/transactions?${params}`);
      return response.data;
    },
    enabled: !!currentSpace,
    ...options,
  });
}

export function useTransaction(transactionId: string) {
  return useQuery<Transaction>({
    queryKey: [QUERY_KEY, transactionId],
    queryFn: async () => {
      const response = await apiClient.get(`/transactions/${transactionId}`);
      return response.data;
    },
    enabled: !!transactionId,
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTransactionDto }) => {
      const response = await apiClient.patch(`/transactions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
    },
  });
}

export function useCategorizeTransaction() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async ({ id, category }: { id: string; category: string }) => {
      const response = await apiClient.post(`/transactions/${id}/categorize`, { category });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
    },
  });
}

export function useTransactionCategories() {
  const { currentSpace } = useSpaces();

  return useQuery<string[]>({
    queryKey: ['transaction-categories', currentSpace?.id],
    queryFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.get(`/transactions/categories?spaceId=${currentSpace.id}`);
      return response.data;
    },
    enabled: !!currentSpace,
  });
}
