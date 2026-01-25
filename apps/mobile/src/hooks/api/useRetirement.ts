import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/services/api';

import { useSpaces } from '../useSpaces';

export interface RetirementConfig {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  initialBalance: number;
  monthlyContribution: number;
  monthlyExpenses?: number;
  socialSecurityIncome?: number;
  expectedReturn: number;
  volatility: number;
  iterations?: number;
  inflationAdjusted?: boolean;
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
  successProbability?: number;
}

export function useSimulateRetirement() {
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (config: RetirementConfig) => {
      if (!currentSpace) throw new Error('No space selected');

      // Transform frontend config to backend API format
      const apiConfig = {
        currentAge: config.currentAge,
        retirementAge: config.retirementAge,
        lifeExpectancy: config.lifeExpectancy,
        currentSavings: config.initialBalance,
        monthlyContribution: config.monthlyContribution,
        monthlyWithdrawal: (config.monthlyExpenses || 0) - (config.socialSecurityIncome || 0),
        preRetirementReturn: config.expectedReturn,
        postRetirementReturn: config.expectedReturn * 0.85, // More conservative in retirement
        returnVolatility: config.volatility,
        iterations: config.iterations || 10000,
        inflationRate: config.inflationAdjusted ? 0.03 : undefined,
      };

      const response = await apiClient.post(`/simulations/retirement`, apiConfig);
      const backendResult = response.data;

      // Transform backend response to frontend format
      const yearsToRetirement = config.retirementAge - config.currentAge;
      const yearsInRetirement = config.lifeExpectancy - config.retirementAge;
      const monthsToRetirement = yearsToRetirement * 12;

      // Calculate values from backend response
      const balanceAtRetirement =
        backendResult.balanceAtRetirement?.median ||
        (backendResult.yearlyProjections?.[yearsToRetirement]?.median) ||
        0;
      const safeWithdrawalRate = (balanceAtRetirement * 0.04) / 12; // 4% rule monthly
      const totalContributions = config.monthlyContribution * monthsToRetirement;
      const finalBalance = backendResult.balanceAtLifeExpectancy?.median || 0;
      const medianYearsOfSustainability =
        finalBalance > 0
          ? yearsInRetirement
          : yearsInRetirement * (backendResult.successProbability || 0.5);

      const result: RetirementSimulationResult = {
        accumulationPhase: {
          yearsToRetirement,
          finalBalanceMedian: balanceAtRetirement,
          finalBalanceP10: backendResult.balanceAtRetirement?.p10 || balanceAtRetirement * 0.6,
          finalBalanceP90: backendResult.balanceAtRetirement?.p90 || balanceAtRetirement * 1.4,
          totalContributions,
        },
        withdrawalPhase: {
          yearsInRetirement,
          probabilityOfNotRunningOut: backendResult.successProbability || 0,
          medianYearsOfSustainability,
          safeWithdrawalRate,
          netMonthlyNeed: (config.monthlyExpenses || 0) - (config.socialSecurityIncome || 0),
        },
        recommendations: {
          increaseContributionBy:
            backendResult.successProbability < 0.75
              ? Math.ceil((balanceAtRetirement * 0.25) / monthsToRetirement / 100) * 100
              : undefined,
          canRetireEarlierBy:
            backendResult.successProbability > 0.95
              ? Math.floor(yearsToRetirement * 0.1)
              : undefined,
          targetNestEgg: balanceAtRetirement,
        },
        successProbability: backendResult.successProbability,
      };

      return result;
    },
  });
}

export function useRecommendedAllocation() {
  return useMutation({
    mutationFn: async ({
      riskTolerance,
      yearsToRetirement,
    }: {
      riskTolerance: 'conservative' | 'moderate' | 'aggressive';
      yearsToRetirement: number;
    }) => {
      const response = await apiClient.post(`/simulations/recommended-allocation`, {
        riskTolerance,
        yearsToRetirement,
      });
      return response.data as {
        riskTolerance: string;
        yearsToRetirement: number;
        expectedReturn: number;
        volatility: number;
        allocation: { stocks: number; bonds: number };
        description: string;
      };
    },
  });
}
