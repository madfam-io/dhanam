import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api';

export interface Household {
  id: string;
  name: string;
  type: 'family' | 'trust' | 'estate' | 'partnership';
  baseCurrency: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members?: HouseholdMember[];
  spaces?: HouseholdSpace[];
  _count?: {
    spaces: number;
    goals: number;
  };
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  relationship: string;
  isMinor: boolean;
  accessStartDate?: string;
  notes?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface HouseholdSpace {
  id: string;
  name: string;
  type: string;
  currency: string;
}

export interface HouseholdNetWorth {
  totalNetWorth: number;
  bySpace: {
    spaceId: string;
    spaceName: string;
    netWorth: number;
    assets: number;
    liabilities: number;
  }[];
  byCurrency: Record<string, number>;
}

export interface HouseholdGoalSummary {
  totalGoals: number;
  activeGoals: number;
  achievedGoals: number;
  totalTargetAmount: number;
  byType: Record<string, number>;
}

export interface CreateHouseholdInput {
  name: string;
  type?: Household['type'];
  baseCurrency?: string;
  description?: string;
}

export const HOUSEHOLD_TYPES = [
  { value: 'family', label: 'Family', icon: 'home-outline' },
  { value: 'trust', label: 'Trust', icon: 'business-outline' },
  { value: 'estate', label: 'Estate', icon: 'map-outline' },
  { value: 'partnership', label: 'Partnership', icon: 'briefcase-outline' },
] as const;

export type HouseholdType = (typeof HOUSEHOLD_TYPES)[number]['value'];

const QUERY_KEY = 'households';

export function useHouseholds() {
  return useQuery<Household[]>({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const response = await apiClient.get('/households');
      return response.data;
    },
  });
}

export function useHousehold(householdId: string | null) {
  return useQuery<Household>({
    queryKey: [QUERY_KEY, householdId],
    queryFn: async () => {
      if (!householdId) throw new Error('No household ID');
      const response = await apiClient.get(`/households/${householdId}`);
      return response.data;
    },
    enabled: !!householdId,
  });
}

export function useHouseholdNetWorth(householdId: string | null) {
  return useQuery<HouseholdNetWorth>({
    queryKey: [QUERY_KEY, householdId, 'net-worth'],
    queryFn: async () => {
      if (!householdId) throw new Error('No household ID');
      const response = await apiClient.get(`/households/${householdId}/net-worth`);
      return response.data;
    },
    enabled: !!householdId,
  });
}

export function useHouseholdGoalSummary(householdId: string | null) {
  return useQuery<HouseholdGoalSummary>({
    queryKey: [QUERY_KEY, householdId, 'goals-summary'],
    queryFn: async () => {
      if (!householdId) throw new Error('No household ID');
      const response = await apiClient.get(`/households/${householdId}/goals/summary`);
      return response.data;
    },
    enabled: !!householdId,
  });
}

export function useCreateHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateHouseholdInput) => {
      const response = await apiClient.post('/households', input);
      return response.data as Household;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (householdId: string) => {
      await apiClient.delete(`/households/${householdId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
