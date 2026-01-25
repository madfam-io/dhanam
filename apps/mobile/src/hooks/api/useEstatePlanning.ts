import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api';

export interface Will {
  id: string;
  householdId: string;
  name: string;
  status: 'draft' | 'active' | 'revoked' | 'executed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
  revokedAt?: string;
  beneficiaries?: WillBeneficiary[];
  executors?: WillExecutor[];
  _count?: {
    beneficiaries: number;
    executors: number;
  };
}

export interface WillBeneficiary {
  id: string;
  willId: string;
  beneficiaryId: string;
  assetType: string;
  percentage: number;
  beneficiary?: {
    id: string;
    relationship: string;
    user: {
      id: string;
      name: string;
    };
  };
}

export interface WillExecutor {
  id: string;
  willId: string;
  executorId: string;
  order: number;
  isPrimary: boolean;
  executor?: {
    id: string;
    relationship: string;
    user: {
      id: string;
      name: string;
    };
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CreateWillInput {
  householdId: string;
  name: string;
  notes?: string;
  legalDisclaimer: boolean;
}

const QUERY_KEY = 'wills';

export function useWillsByHousehold(householdId: string | null) {
  return useQuery<Will[]>({
    queryKey: [QUERY_KEY, 'household', householdId],
    queryFn: async () => {
      if (!householdId) throw new Error('No household ID');
      const response = await apiClient.get(`/wills/household/${householdId}`);
      return response.data;
    },
    enabled: !!householdId,
  });
}

export function useWill(willId: string | null) {
  return useQuery<Will>({
    queryKey: [QUERY_KEY, willId],
    queryFn: async () => {
      if (!willId) throw new Error('No will ID');
      const response = await apiClient.get(`/wills/${willId}`);
      return response.data;
    },
    enabled: !!willId,
  });
}

export function useValidateWill(willId: string | null) {
  return useQuery<ValidationResult>({
    queryKey: [QUERY_KEY, willId, 'validation'],
    queryFn: async () => {
      if (!willId) throw new Error('No will ID');
      const response = await apiClient.get(`/wills/${willId}/validate`);
      return response.data;
    },
    enabled: !!willId,
  });
}

export function useCreateWill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWillInput) => {
      const response = await apiClient.post('/wills', input);
      return response.data as Will;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'household', data.householdId] });
    },
  });
}

export function useActivateWill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (willId: string) => {
      const response = await apiClient.put(`/wills/${willId}/activate`);
      return response.data as Will;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useRevokeWill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (willId: string) => {
      const response = await apiClient.put(`/wills/${willId}/revoke`);
      return response.data as Will;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
