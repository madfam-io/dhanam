import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api';

import { useSpaces } from '../useSpaces';

export interface Goal {
  id: string;
  spaceId: string;
  name: string;
  description?: string;
  type:
    | 'retirement'
    | 'education'
    | 'house_purchase'
    | 'emergency_fund'
    | 'legacy'
    | 'travel'
    | 'business'
    | 'debt_payoff'
    | 'other';
  targetAmount: number;
  currency: string;
  targetDate: string;
  priority: number;
  status: 'active' | 'paused' | 'achieved' | 'abandoned';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  allocations?: GoalAllocation[];
  currentProbability?: number;
  probabilityHistory?: Array<{ month: number; probability: number }>;
}

export interface GoalAllocation {
  id: string;
  goalId: string;
  accountId: string;
  percentage: number;
  notes?: string;
  account?: {
    id: string;
    name: string;
    balance: number;
  };
}

export interface GoalProgress {
  goalId: string;
  currentValue: number;
  percentComplete: number;
  timeProgress: number;
  onTrack: boolean;
  monthlyContributionNeeded: number;
  projectedCompletion: string | null;
  allocations: {
    accountId: string;
    accountName: string;
    contributedValue: number;
    percentage: number;
  }[];
}

export interface GoalSummary {
  totalGoals: number;
  activeGoals: number;
  achievedGoals: number;
  totalTargetAmount: number;
  totalCurrentValue: number;
  overallProgress: number;
}

export interface GoalProbabilityResult {
  goalId: string;
  probability: number;
  confidenceLow: number;
  confidenceHigh: number;
  currentProgress: number;
  projectedCompletion: string | null;
  recommendedMonthlyContribution: number;
  timeline: {
    month: number;
    median: number;
    p10: number;
    p90: number;
  }[];
}

export interface CreateGoalDto {
  name: string;
  description?: string;
  type: Goal['type'];
  targetAmount: number;
  currency?: string;
  targetDate: string;
  priority?: number;
  notes?: string;
}

export interface UpdateGoalDto {
  name?: string;
  description?: string;
  targetAmount?: number;
  targetDate?: string;
  priority?: number;
  status?: Goal['status'];
  notes?: string;
}

export interface AddAllocationDto {
  accountId: string;
  percentage: number;
  notes?: string;
}

export interface WhatIfScenario {
  monthlyContribution?: number;
  targetAmount?: number;
  targetDate?: string;
  expectedReturn?: number;
  volatility?: number;
}

const QUERY_KEY = 'goals';

export function useGoals() {
  const { currentSpace } = useSpaces();

  return useQuery<Goal[]>({
    queryKey: [QUERY_KEY, currentSpace?.id],
    queryFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.get(`/goals/space/${currentSpace.id}`);
      return response.data;
    },
    enabled: !!currentSpace,
  });
}

export function useGoal(goalId: string) {
  return useQuery<Goal>({
    queryKey: [QUERY_KEY, goalId],
    queryFn: async () => {
      const response = await apiClient.get(`/goals/${goalId}`);
      return response.data;
    },
    enabled: !!goalId,
  });
}

export function useGoalSummary() {
  const { currentSpace } = useSpaces();

  return useQuery<GoalSummary>({
    queryKey: [QUERY_KEY, 'summary', currentSpace?.id],
    queryFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.get(`/goals/space/${currentSpace.id}/summary`);
      return response.data;
    },
    enabled: !!currentSpace,
  });
}

export function useGoalProgress(goalId: string) {
  return useQuery<GoalProgress>({
    queryKey: [QUERY_KEY, goalId, 'progress'],
    queryFn: async () => {
      const response = await apiClient.get(`/goals/${goalId}/progress`);
      return response.data;
    },
    enabled: !!goalId,
  });
}

export function useGoalProbability(goalId: string) {
  return useQuery<GoalProbabilityResult>({
    queryKey: [QUERY_KEY, goalId, 'probability'],
    queryFn: async () => {
      const response = await apiClient.get(`/goals/${goalId}/probability`);
      return response.data;
    },
    enabled: !!goalId,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (data: CreateGoalDto) => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.post('/goals', {
        ...data,
        spaceId: currentSpace.id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'summary', currentSpace?.id] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateGoalDto }) => {
      const response = await apiClient.put(`/goals/${id}`, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'summary', currentSpace?.id] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'summary', currentSpace?.id] });
    },
  });
}

export function useAddGoalAllocation() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async ({ goalId, data }: { goalId: string; data: AddAllocationDto }) => {
      const response = await apiClient.post(`/goals/${goalId}/allocations`, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.goalId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.goalId, 'progress'] });
    },
  });
}

export function useRemoveGoalAllocation() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async ({ goalId, accountId }: { goalId: string; accountId: string }) => {
      await apiClient.delete(`/goals/${goalId}/allocations/${accountId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.goalId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.goalId, 'progress'] });
    },
  });
}

export function useUpdateGoalProbability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      const response = await apiClient.post(`/goals/${goalId}/probability/update`);
      return response.data;
    },
    onSuccess: (_data, goalId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, goalId, 'probability'] });
    },
  });
}

export function useWhatIfScenario() {
  return useMutation({
    mutationFn: async ({ goalId, scenario }: { goalId: string; scenario: WhatIfScenario }) => {
      const response = await apiClient.post(`/goals/${goalId}/what-if`, scenario);
      return response.data as GoalProbabilityResult;
    },
  });
}

export function useUpdateAllGoalProbabilities() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.post(
        `/goals/space/${currentSpace.id}/probability/update-all`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
