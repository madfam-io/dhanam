import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface Goal {
  id: string;
  spaceId: string;
  name: string;
  description?: string;
  type: 'retirement' | 'education' | 'house_purchase' | 'emergency_fund' | 'legacy' | 'travel' | 'business' | 'debt_payoff' | 'other';
  targetAmount: number;
  currency: string;
  targetDate: string;
  priority: number;
  status: 'active' | 'paused' | 'achieved' | 'abandoned';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  allocations?: GoalAllocation[];
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

export interface CreateGoalInput {
  spaceId: string;
  name: string;
  description?: string;
  type: Goal['type'];
  targetAmount: number;
  currency?: string;
  targetDate: string;
  priority?: number;
  notes?: string;
}

export interface UpdateGoalInput {
  name?: string;
  description?: string;
  targetAmount?: number;
  targetDate?: string;
  priority?: number;
  status?: Goal['status'];
  notes?: string;
}

export interface AddAllocationInput {
  accountId: string;
  percentage: number;
  notes?: string;
}

interface GoalsError {
  statusCode: number;
  message: string;
  error: string;
}

export function useGoals() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GoalsError | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleRequest = async <T,>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`${apiBaseUrl}/goals/${endpoint}`, options);

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData);
        return null;
      }

      if (method === 'DELETE' || response.status === 204) {
        return null;
      }

      const result = await response.json();
      return result as T;
    } catch (err) {
      setError({
        statusCode: 500,
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        error: 'Internal Server Error',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (input: CreateGoalInput): Promise<Goal | null> => {
    return handleRequest<Goal>('POST', '', input);
  };

  const getGoalsBySpace = async (spaceId: string): Promise<Goal[] | null> => {
    return handleRequest<Goal[]>('GET', `space/${spaceId}`);
  };

  const getGoalSummary = async (spaceId: string): Promise<GoalSummary | null> => {
    return handleRequest<GoalSummary>('GET', `space/${spaceId}/summary`);
  };

  const getGoalById = async (goalId: string): Promise<Goal | null> => {
    return handleRequest<Goal>('GET', goalId);
  };

  const updateGoal = async (goalId: string, input: UpdateGoalInput): Promise<Goal | null> => {
    return handleRequest<Goal>('PUT', goalId, input);
  };

  const deleteGoal = async (goalId: string): Promise<void> => {
    await handleRequest('DELETE', goalId);
  };

  const getGoalProgress = async (goalId: string): Promise<GoalProgress | null> => {
    return handleRequest<GoalProgress>('GET', `${goalId}/progress`);
  };

  const addAllocation = async (goalId: string, input: AddAllocationInput): Promise<GoalAllocation | null> => {
    return handleRequest<GoalAllocation>('POST', `${goalId}/allocations`, input);
  };

  const removeAllocation = async (goalId: string, accountId: string): Promise<void> => {
    await handleRequest('DELETE', `${goalId}/allocations/${accountId}`);
  };

  return {
    createGoal,
    getGoalsBySpace,
    getGoalSummary,
    getGoalById,
    updateGoal,
    deleteGoal,
    getGoalProgress,
    addAllocation,
    removeAllocation,
    loading,
    error,
  };
}
