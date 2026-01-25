import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/services/api';

export interface ScenarioConfig {
  initialBalance: number;
  monthlyContribution: number;
  years: number;
  expectedReturn: number;
  returnVolatility: number;
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
  median: number;
  mean: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  min: number;
  max: number;
  timeSeries: MonthlySnapshot[];
}

export interface ScenarioComparisonResult {
  scenarioName: string;
  scenarioDescription: string;
  scenario: {
    type: string;
    name: string;
    description: string;
    severity: 'mild' | 'moderate' | 'severe';
    median?: number;
    p10?: number;
    p90?: number;
    timeSeries?: MonthlySnapshot[];
  };
  baseline: SimulationResult;
  stressed: SimulationResult;
  comparison: {
    medianDifference: number;
    medianDifferencePercent: number;
    p10Difference: number;
    p10DifferencePercent: number;
    recoveryYears: number | null;
    recoveryMonths?: number;
    impactSeverity: 'minimal' | 'moderate' | 'significant' | 'critical';
    worthStressTesting: boolean;
  };
}

export const SCENARIOS = [
  { value: 'BEAR_MARKET', label: 'Bear Market', severity: 'medium' as const },
  { value: 'GREAT_RECESSION', label: 'Great Recession (2008)', severity: 'high' as const },
  { value: 'DOT_COM_BUST', label: 'Dot-com Bust (2000)', severity: 'high' as const },
  { value: 'MILD_RECESSION', label: 'Mild Recession', severity: 'low' as const },
  { value: 'MARKET_CORRECTION', label: 'Market Correction', severity: 'low' as const },
  { value: 'STAGFLATION', label: 'Stagflation (1970s)', severity: 'high' as const },
  { value: 'COVID_SHOCK', label: 'COVID-19 Style Shock', severity: 'medium' as const },
  { value: 'FLASH_CRASH', label: 'Flash Crash', severity: 'medium' as const },
  { value: 'BOOM_CYCLE', label: 'Boom Cycle', severity: 'positive' as const },
] as const;

export type ScenarioType = typeof SCENARIOS[number]['value'];

export function useAnalyzeScenario() {
  return useMutation({
    mutationFn: async ({
      scenarioType,
      config,
    }: {
      scenarioType: ScenarioType;
      config: ScenarioConfig;
    }) => {
      const response = await apiClient.post(`/simulations/scenario-analysis`, {
        scenarioType,
        ...config,
      });
      return response.data as ScenarioComparisonResult;
    },
  });
}
