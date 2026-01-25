import { useQuery, useMutation } from '@tanstack/react-query';

import { apiClient } from '@/services/api';

import { useSpaces } from '../useSpaces';

export interface LifeEvent {
  type: 'retirement' | 'home_purchase' | 'education' | 'career_change' | 'custom';
  name: string;
  year: number;
  amount: number;
  recurring?: boolean;
}

export interface CreateProjectionDto {
  projectionYears: number;
  inflationRate: number;
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  includeAccounts: boolean;
  includeRecurring: boolean;
  lifeEvents: LifeEvent[];
}

export interface ProjectionYear {
  year: number;
  age: number;
  income: number;
  expenses: number;
  savings: number;
  netWorth: number;
  portfolioValue: number;
}

export interface ProjectionResult {
  summary: {
    currentNetWorth: number;
    projectedNetWorth: number;
    projectedRetirementSavings: number;
    monthlyRetirementIncome: number;
    savingsGap: number;
    riskScore: number;
    successProbability: number;
  };
  yearlyProjections: ProjectionYear[];
  milestones: {
    year: number;
    event: string;
    impact: number;
  }[];
}

const QUERY_KEY = 'projections';

export function useProjection(config: CreateProjectionDto | null) {
  const { currentSpace } = useSpaces();

  return useQuery<ProjectionResult>({
    queryKey: [QUERY_KEY, currentSpace?.id, config],
    queryFn: async () => {
      if (!currentSpace || !config) throw new Error('Missing parameters');
      const response = await apiClient.post(`/projections/generate`, {
        spaceId: currentSpace.id,
        ...config,
      });
      return response.data;
    },
    enabled: !!currentSpace && !!config,
    staleTime: 5 * 60 * 1000, // 5 minutes - projections don't change often
  });
}

export function useGenerateProjection() {
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (config: CreateProjectionDto) => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.post(`/projections/generate`, {
        spaceId: currentSpace.id,
        ...config,
      });
      return response.data as ProjectionResult;
    },
  });
}

export function useQuickProjection() {
  const { currentSpace } = useSpaces();

  return useQuery<ProjectionResult>({
    queryKey: [QUERY_KEY, 'quick', currentSpace?.id],
    queryFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      // Generate with default settings
      const response = await apiClient.post(`/projections/generate`, {
        spaceId: currentSpace.id,
        projectionYears: 30,
        inflationRate: 0.03,
        currentAge: 35,
        retirementAge: 65,
        lifeExpectancy: 90,
        includeAccounts: true,
        includeRecurring: true,
        lifeEvents: [],
      });
      return response.data;
    },
    enabled: !!currentSpace,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
