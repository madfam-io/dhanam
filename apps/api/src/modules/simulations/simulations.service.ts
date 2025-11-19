import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';

import { MonteCarloEngine } from './engines/monte-carlo.engine';
import {
  MonteCarloConfig,
  SimulationResult,
  RetirementSimulationConfig,
  RetirementSimulationResult,
  GoalProbabilityConfig,
  GoalProbabilityResult,
  ScenarioComparisonResult,
} from './types/simulation.types';
import { StatisticsUtil } from './utils/statistics.util';

@Injectable()
export class SimulationsService {
  private readonly logger = new Logger(SimulationsService.name);

  // Default simulation parameters
  private readonly DEFAULT_ITERATIONS = 10000;
  private readonly DEFAULT_EXPECTED_RETURN = 0.07; // 7% annual
  private readonly DEFAULT_VOLATILITY = 0.15; // 15% annual
  private readonly DEFAULT_INFLATION = 0.03; // 3% annual
  private readonly DEFAULT_RISK_FREE_RATE = 0.02; // 2% annual

  constructor(
    private prisma: PrismaService,
    private monteCarlo: MonteCarloEngine
  ) {}

  /**
   * Run basic Monte Carlo simulation
   */
  async runSimulation(config: MonteCarloConfig): Promise<SimulationResult> {
    this.logger.log(`Running Monte Carlo simulation for ${config.months} months`);

    const result = this.monteCarlo.simulate(config);

    return result;
  }

  /**
   * Calculate probability of achieving a financial goal
   */
  async calculateGoalProbability(
    config: GoalProbabilityConfig,
    userId: string
  ): Promise<GoalProbabilityResult> {
    this.logger.log(`Calculating probability for goal: ${config.goalId}`);

    // Verify user has access to the goal
    await this.verifyGoalAccess(config.goalId, userId);

    // Run Monte Carlo simulation
    const simulationConfig: MonteCarloConfig = {
      initialBalance: config.currentValue,
      monthlyContribution: config.monthlyContribution,
      months: config.monthsRemaining,
      iterations: config.iterations || this.DEFAULT_ITERATIONS,
      expectedReturn: config.expectedReturn,
      volatility: config.volatility,
    };

    const result = this.monteCarlo.simulate(simulationConfig);

    // Calculate success rate
    const successRate = this.monteCarlo.calculateSuccessRate(
      result.finalValues,
      config.targetAmount
    );

    // Calculate expected shortfall
    const expectedShortfall = this.monteCarlo.calculateExpectedShortfall(
      result.finalValues,
      config.targetAmount
    );

    // Find required monthly contribution for 90% success rate
    const recommendedContribution = this.monteCarlo.findRequiredContribution(
      {
        initialBalance: config.currentValue,
        months: config.monthsRemaining,
        iterations: 1000,
        expectedReturn: config.expectedReturn,
        volatility: config.volatility,
      },
      config.targetAmount,
      0.9 // 90% success rate
    );

    return {
      goalId: config.goalId,
      targetAmount: config.targetAmount,
      probabilityOfSuccess: successRate,
      medianOutcome: result.median,
      expectedShortfall,
      confidence90Range: {
        low: result.p10,
        high: result.p90,
      },
      recommendedMonthlyContribution: recommendedContribution,
    };
  }

  /**
   * Run retirement simulation with withdrawal phase
   */
  async simulateRetirement(
    config: RetirementSimulationConfig,
    _userId: string
  ): Promise<RetirementSimulationResult> {
    this.logger.log(`Simulating retirement: age ${config.currentAge} → ${config.lifeExpectancy}`);

    // Phase 1: Accumulation (current age → retirement age)
    const monthsToRetirement = (config.retirementAge - config.currentAge) * 12;

    const accumulationResult = this.monteCarlo.simulate({
      initialBalance: config.initialBalance,
      monthlyContribution: config.monthlyContribution,
      months: monthsToRetirement,
      iterations: config.iterations,
      expectedReturn: config.expectedReturn,
      volatility: config.volatility,
    });

    // Phase 2: Withdrawal (retirement age → life expectancy)
    const monthsInRetirement = (config.lifeExpectancy - config.retirementAge) * 12;
    const monthlyWithdrawal = -(config.monthlyExpenses || 0) + (config.socialSecurityIncome || 0);

    // Run withdrawal simulations for each accumulation outcome
    const finalBalances: number[] = [];
    const depletionMonths: number[] = [];

    // Sample 1000 outcomes from accumulation phase for performance
    const sampleSize = Math.min(1000, accumulationResult.finalValues.length);
    const sampledRetirementBalances = this.sampleArray(accumulationResult.finalValues, sampleSize);

    for (const retirementBalance of sampledRetirementBalances) {
      const withdrawalResult = this.simulateSingleWithdrawal(
        retirementBalance,
        monthsInRetirement,
        monthlyWithdrawal,
        config.expectedReturn,
        config.volatility
      );

      finalBalances.push(withdrawalResult.finalBalance);
      depletionMonths.push(withdrawalResult.monthsUntilDepletion);
    }

    // Calculate summary statistics
    const summary = StatisticsUtil.summary(finalBalances);
    const medianDepletionMonths = StatisticsUtil.median(depletionMonths);

    // Calculate probability of not running out
    const successfulRetirements = finalBalances.filter((balance) => balance > 0).length;
    const probabilityOfNotRunningOut = successfulRetirements / finalBalances.length;

    // Calculate safe withdrawal rate (4% rule adjusted)
    const medianRetirementBalance = accumulationResult.median;
    const safeWithdrawalRate = this.calculateSafeWithdrawalRate(
      medianRetirementBalance,
      monthsInRetirement,
      config.expectedReturn,
      config.volatility,
      0.95 // 95% success rate
    );

    // Combine time series from both phases
    const retirementTimeSeries = this.createRetirementTimeSeries(
      accumulationResult,
      sampledRetirementBalances,
      monthsInRetirement,
      monthlyWithdrawal,
      config.expectedReturn,
      config.volatility
    );

    const result: RetirementSimulationResult = {
      ...accumulationResult,
      finalValues: finalBalances,
      median: summary.median,
      mean: summary.mean,
      stdDev: summary.stdDev,
      p10: summary.p10,
      p25: summary.p25,
      p75: summary.p75,
      p90: summary.p90,
      min: summary.min,
      max: summary.max,
      timeSeries: retirementTimeSeries,
      probabilityOfNotRunningOut,
      medianRetirementBalance,
      medianFinalBalance: summary.median,
      yearsOfSustainability: medianDepletionMonths / 12,
      safeWithdrawalRate,
    };

    return result;
  }

  /**
   * Compare baseline scenario with stress scenario
   */
  async compareScenarios(
    baseConfig: MonteCarloConfig,
    scenarioName: keyof typeof MonteCarloEngine.SCENARIOS
  ): Promise<ScenarioComparisonResult> {
    this.logger.log(`Comparing baseline vs ${scenarioName} scenario`);

    // Run baseline simulation
    const baseline = this.monteCarlo.simulate(baseConfig);

    // Run scenario simulation
    const scenario = MonteCarloEngine.SCENARIOS[scenarioName];
    const scenarioResult = this.monteCarlo.simulateWithShocks(baseConfig, scenario.shocks);

    // Calculate differences
    const comparison = {
      medianDifference: scenarioResult.median - baseline.median,
      medianDifferencePercent: ((scenarioResult.median - baseline.median) / baseline.median) * 100,
      successRateDifference: 0,
      worstCaseDifference: scenarioResult.p10 - baseline.p10,
    };

    return {
      baseline,
      scenario: scenarioResult,
      comparison,
    };
  }

  /**
   * Get recommended portfolio allocation based on risk tolerance
   */
  getRecommendedAllocation(
    riskTolerance: 'conservative' | 'moderate' | 'aggressive',
    yearsToRetirement: number
  ): {
    expectedReturn: number;
    volatility: number;
    allocation: { stocks: number; bonds: number; cash: number };
  } {
    // Adjust allocation based on time horizon (stocks decrease as retirement approaches)
    const stockAdjustment = Math.max(0, Math.min(20, (yearsToRetirement - 10) * 2));

    const allocations = {
      conservative: {
        baseStocks: 40,
        expectedReturn: 0.05,
        volatility: 0.1,
      },
      moderate: {
        baseStocks: 60,
        expectedReturn: 0.07,
        volatility: 0.15,
      },
      aggressive: {
        baseStocks: 80,
        expectedReturn: 0.09,
        volatility: 0.2,
      },
    };

    const profile = allocations[riskTolerance];
    const stocks = Math.min(95, profile.baseStocks + stockAdjustment);
    const bonds = Math.max(5, 100 - stocks - 5);
    const cash = 100 - stocks - bonds;

    return {
      expectedReturn: profile.expectedReturn,
      volatility: profile.volatility,
      allocation: { stocks, bonds, cash },
    };
  }

  /**
   * Helper: Simulate single withdrawal phase
   */
  private simulateSingleWithdrawal(
    startingBalance: number,
    months: number,
    monthlyWithdrawal: number,
    annualReturn: number,
    annualVolatility: number
  ): { finalBalance: number; monthsUntilDepletion: number } {
    let balance = startingBalance;
    let monthsUntilDepletion = months;

    const monthlyReturn = StatisticsUtil.monthlyReturn(annualReturn);
    const monthlyVolatility = StatisticsUtil.monthlyVolatility(annualVolatility);

    for (let month = 1; month <= months; month++) {
      const randomReturn = monthlyReturn + monthlyVolatility * StatisticsUtil.randomNormal(0, 1);
      balance = balance * (1 + randomReturn) + monthlyWithdrawal;

      if (balance <= 0) {
        monthsUntilDepletion = month;
        balance = 0;
        break;
      }
    }

    return { finalBalance: balance, monthsUntilDepletion };
  }

  /**
   * Helper: Calculate safe withdrawal rate
   */
  private calculateSafeWithdrawalRate(
    portfolioValue: number,
    months: number,
    annualReturn: number,
    annualVolatility: number,
    successRate: number
  ): number {
    if (portfolioValue <= 0) return 0;

    // Binary search for safe withdrawal rate
    let low = 0;
    let high = 0.1; // 10% monthly (very high)

    for (let i = 0; i < 10; i++) {
      const mid = (low + high) / 2;
      const monthlyWithdrawal = -(portfolioValue * mid);

      // Run quick simulation
      let successes = 0;
      const trials = 100;

      for (let trial = 0; trial < trials; trial++) {
        const result = this.simulateSingleWithdrawal(
          portfolioValue,
          months,
          monthlyWithdrawal,
          annualReturn,
          annualVolatility
        );

        if (result.finalBalance > 0) successes++;
      }

      const currentSuccessRate = successes / trials;

      if (Math.abs(currentSuccessRate - successRate) < 0.05) {
        return mid * 12; // Convert to annual rate
      }

      if (currentSuccessRate < successRate) {
        high = mid;
      } else {
        low = mid;
      }
    }

    return ((low + high) / 2) * 12; // Convert to annual rate
  }

  /**
   * Helper: Create combined time series for retirement simulation
   */
  private createRetirementTimeSeries(
    accumulationResult: SimulationResult,
    _sampledBalances: number[],
    _withdrawalMonths: number,
    _monthlyWithdrawal: number,
    _annualReturn: number,
    _annualVolatility: number
  ) {
    // For simplicity, return accumulation time series
    // Full implementation would combine both phases
    return accumulationResult.timeSeries;
  }

  /**
   * Helper: Sample array randomly
   */
  private sampleArray(array: number[], sampleSize: number): number[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, sampleSize);
  }

  /**
   * Helper: Verify user has access to goal
   */
  private async verifyGoalAccess(goalId: string, userId: string): Promise<void> {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      include: { space: { include: { userSpaces: true } } },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    const hasAccess = goal.space.userSpaces.some((us) => us.userId === userId);

    if (!hasAccess) {
      throw new NotFoundException('Goal not found or you do not have access');
    }
  }
}
