import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface MonteCarloConfig {
  initialBalance: number;
  monthlyContribution: number;
  months: number;
  iterations?: number;
  expectedReturn: number;
  volatility: number;
}

export interface RetirementConfig {
  initialBalance: number;
  monthlyContribution: number;
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  monthlyExpenses?: number;
  socialSecurityIncome?: number;
  expectedReturn: number;
  volatility: number;
  iterations?: number;
  inflationAdjusted?: boolean;
}

export interface GoalProbabilityConfig {
  goalId?: string;
  currentValue: number;
  targetAmount: number;
  monthsRemaining: number;
  monthlyContribution?: number;
  expectedReturn: number;
  volatility: number;
  iterations?: number;
}

export interface MonthlySnapshot {
  month: number;
  median: number;
  mean: number;
  p10: number;
  p90: number;
}

export interface SimulationResult {
  finalValues: number[];
  median: number;
  mean: number;
  stdDev: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  min: number;
  max: number;
  timeSeries: MonthlySnapshot[];
  computedAt: Date;
}

export interface GoalProbabilityResult {
  probabilityOfSuccess: number;
  medianOutcome: number;
  expectedShortfall: number;
  confidence90Range: {
    low: number;
    high: number;
  };
  recommendedMonthlyContribution: number;
  currentMonthlyContribution: number;
  targetAmount: number;
  monthsRemaining: number;
  simulation: SimulationResult;
}

export interface RetirementSimulationResult {
  accumulationPhase: {
    yearsToRetirement: number;
    finalBalanceMedian: number;
    finalBalanceP10: number;
    finalBalanceP90: number;
    totalContributions: number;
  };
  withdrawalPhase: {
    yearsInRetirement: number;
    probabilityOfNotRunningOut: number;
    medianYearsOfSustainability: number;
    safeWithdrawalRate: number;
    netMonthlyNeed: number;
  };
  recommendations: {
    increaseContributionBy?: number;
    canRetireEarlierBy?: number;
    targetNestEgg: number;
  };
  simulation: SimulationResult;
}

export interface ScenarioComparisonResult {
  baseline: SimulationResult;
  scenario: SimulationResult;
  scenarioName: string;
  scenarioDescription: string;
  comparison: {
    medianDifference: number;
    medianDifferencePercent: number;
    p10Difference: number;
    recoveryMonths: number;
    worthStressTesting: boolean;
  };
}

export interface RecommendedAllocation {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  yearsToRetirement: number;
  expectedReturn: number;
  volatility: number;
  allocation: {
    stocks: number;
    bonds: number;
  };
  description: string;
}

interface SimulationsError {
  statusCode: number;
  message: string;
  error: string;
}

export function useSimulations() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SimulationsError | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleRequest = async <T,>(
    endpoint: string,
    config: any
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch(`${apiBaseUrl}/simulations/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData);
        return null;
      }

      const data = await response.json();
      return data as T;
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

  const runSimulation = async (
    config: MonteCarloConfig
  ): Promise<SimulationResult | null> => {
    return handleRequest<SimulationResult>('monte-carlo', config);
  };

  const calculateGoalProbability = async (
    config: GoalProbabilityConfig
  ): Promise<GoalProbabilityResult | null> => {
    return handleRequest<GoalProbabilityResult>('goal-probability', config);
  };

  const simulateRetirement = async (
    config: RetirementConfig
  ): Promise<RetirementSimulationResult | null> => {
    return handleRequest<RetirementSimulationResult>('retirement', config);
  };

  const compareScenarios = async (
    scenarioName: string,
    config: MonteCarloConfig
  ): Promise<ScenarioComparisonResult | null> => {
    return handleRequest<ScenarioComparisonResult>(
      `scenarios/${scenarioName}`,
      config
    );
  };

  const getRecommendedAllocation = async (
    riskTolerance: 'conservative' | 'moderate' | 'aggressive',
    yearsToRetirement: number
  ): Promise<RecommendedAllocation | null> => {
    const token = await getToken();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiBaseUrl}/simulations/recommended-allocation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ riskTolerance, yearsToRetirement }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData);
        return null;
      }

      const data = await response.json();
      return data as RecommendedAllocation;
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

  return {
    runSimulation,
    calculateGoalProbability,
    simulateRetirement,
    compareScenarios,
    getRecommendedAllocation,
    loading,
    error,
  };
}
