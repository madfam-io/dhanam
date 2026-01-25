import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api';

import { useSpaces } from '../useSpaces';

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'crypto' | 'investment' | 'other';
  provider: 'belvo' | 'plaid' | 'bitso' | 'manual' | 'blockchain';
  currency: string;
  balance: number;
  lastSyncedAt: string;
  institutionName?: string;
  mask?: string;
}

export interface CreateAccountDto {
  name: string;
  type: Account['type'];
  provider?: Account['provider'];
  currency: string;
  balance?: number;
  institutionName?: string;
}

export interface UpdateAccountDto {
  name?: string;
  balance?: number;
}

const QUERY_KEY = 'accounts';

export function useAccounts() {
  const { currentSpace } = useSpaces();

  return useQuery<Account[]>({
    queryKey: [QUERY_KEY, currentSpace?.id],
    queryFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.get(`/accounts?spaceId=${currentSpace.id}`);
      return response.data;
    },
    enabled: !!currentSpace,
  });
}

export function useAccount(accountId: string) {
  return useQuery<Account>({
    queryKey: [QUERY_KEY, accountId],
    queryFn: async () => {
      const response = await apiClient.get(`/accounts/${accountId}`);
      return response.data;
    },
    enabled: !!accountId,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (data: CreateAccountDto) => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.post('/accounts', {
        ...data,
        spaceId: currentSpace.id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAccountDto }) => {
      const response = await apiClient.patch(`/accounts/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
    },
  });
}

export function useSyncAccount() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/accounts/${id}/sync`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
    },
  });
}
