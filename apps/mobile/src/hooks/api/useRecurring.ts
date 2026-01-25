import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api';

import { useSpaces } from '../useSpaces';

export type RecurrenceFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export type RecurringStatus = 'detected' | 'confirmed' | 'dismissed' | 'paused';

export interface RecurringTransaction {
  id: string;
  merchantName: string;
  frequency: RecurrenceFrequency;
  expectedAmount: number;
  currency: string;
  status: RecurringStatus;
  confidence: number;
  occurrenceCount: number;
  lastOccurrence: string | null;
  nextExpected: string | null;
  recentTransactions?: {
    id: string;
    description: string;
    amount: number;
    date: string;
  }[];
}

export interface RecurringSummary {
  totalMonthly: number;
  totalAnnual: number;
  currency: string;
  activeCount: number;
  detectedCount: number;
  upcomingThisMonth: {
    id: string;
    merchantName: string;
    expectedAmount: number;
    nextExpected: string;
  }[];
}

const QUERY_KEY = 'recurring';

export function useRecurring(options?: { includeDetected?: boolean }) {
  const { currentSpace } = useSpaces();

  return useQuery<RecurringTransaction[]>({
    queryKey: [QUERY_KEY, currentSpace?.id, options?.includeDetected],
    queryFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      const params = options?.includeDetected ? '?includeDetected=true' : '';
      const response = await apiClient.get(
        `/recurring?spaceId=${currentSpace.id}${params}`
      );
      return response.data;
    },
    enabled: !!currentSpace,
  });
}

export function useRecurringSummary() {
  const { currentSpace } = useSpaces();

  return useQuery<RecurringSummary>({
    queryKey: [QUERY_KEY, 'summary', currentSpace?.id],
    queryFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.get(
        `/recurring/summary?spaceId=${currentSpace.id}`
      );
      return response.data;
    },
    enabled: !!currentSpace,
  });
}

export function useDetectRecurring() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.post(`/recurring/detect`, {
        spaceId: currentSpace.id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'summary', currentSpace?.id],
      });
    },
  });
}

export function useConfirmRecurring() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.post(`/recurring/${id}/confirm`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'summary', currentSpace?.id],
      });
    },
  });
}

export function useDismissRecurring() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.post(`/recurring/${id}/dismiss`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
    },
  });
}

export function useTogglePauseRecurring() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.post(`/recurring/${id}/toggle-pause`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
    },
  });
}

export function useDeleteRecurring() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!currentSpace) throw new Error('No space selected');
      await apiClient.delete(`/recurring/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'summary', currentSpace?.id],
      });
    },
  });
}
