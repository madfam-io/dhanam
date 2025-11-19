import { Injectable, Logger } from '@nestjs/common';
import { StatisticsUtil } from '../utils/statistics.util';
import {
  MonteCarloConfig,
  SimulationResult,
  MonthlySnapshot,
  MarketShock,
  ScenarioConfig,
} from '../types/simulation.types';

/**
 * Monte Carlo Simulation Engine
 *
 * Performs stochastic simulations of portfolio growth using Monte Carlo methods.
 * Uses geometric Brownian motion for modeling asset returns with random walk.
 */
@Injectable()
export class MonteCarloEngine {
  private readonly logger = new Logger(MonteCarloEngine.name);

  /**
   * Run Monte Carlo simulation
   */
  simulate(config: MonteCarloConfig): SimulationResult {
    this.logger.log(`Starting Monte Carlo simulation: ${config.iterations} iterations, ${config.months} months`);

    const startTime = Date.now();

    // Validate configuration
    this.validateConfig(config);

    // Convert annual parameters to monthly
    const monthlyReturn = StatisticsUtil.monthlyReturn(config.expectedReturn);
    const monthlyVolatility = StatisticsUtil.monthlyVolatility(config.volatility);

    // Run all iterations
    const finalValues: number[] = [];
    const allTimeSeries: number[][] = Array(config.months + 1).fill(null).map(() => []);

    for (let iteration = 0; iteration < config.iterations; iteration++) {
      const result = this.runSingleIteration(
        config,
        monthlyReturn,
        monthlyVolatility
      );

      finalValues.push(result.finalValue);

      // Store time series data
      result.monthlyValues.forEach((value, monthIndex) => {
        allTimeSeries[monthIndex].push(value);
      });
    }

    // Calculate time series statistics
    const timeSeries: MonthlySnapshot[] = allTimeSeries.map((values, month) => ({
      month,
      median: StatisticsUtil.median(values),
      mean: StatisticsUtil.mean(values),
      p10: StatisticsUtil.percentile(values, 0.10),
      p90: StatisticsUtil.percentile(values, 0.90),
    }));

    // Calculate summary statistics
    const summary = StatisticsUtil.summary(finalValues);

    const result: SimulationResult = {
      finalValues,
      median: summary.median,
      mean: summary.mean,
      stdDev: summary.stdDev,
      p10: summary.p10,
      p25: summary.p25,
      p75: summary.p75,
      p90: summary.p90,
      min: summary.min,
      max: summary.max,
      timeSeries,
      config,
      computedAt: new Date(),
    };

    const duration = Date.now() - startTime;
    this.logger.log(`Simulation completed in ${duration}ms`);

    return result;
  }

  /**
   * Run single iteration of the simulation
   */
  private runSingleIteration(
    config: MonteCarloConfig,
    monthlyReturn: number,
    monthlyVolatility: number,
    shocks?: MarketShock[]
  ): { finalValue: number; monthlyValues: number[] } {
    let balance = config.initialBalance;
    const monthlyValues: number[] = [balance];

    for (let month = 1; month <= config.months; month++) {
      // Apply market shock if applicable
      const shockReturn = this.getShockReturn(month, shocks);

      // Generate random return using geometric Brownian motion
      // r = μ + σ * Z, where Z ~ N(0,1)
      const randomReturn = monthlyReturn + monthlyVolatility * StatisticsUtil.randomNormal(0, 1);

      // Apply shock if present
      const totalReturn = shockReturn !== null ? shockReturn : randomReturn;

      // Update balance: balance = balance * (1 + return) + contribution
      balance = balance * (1 + totalReturn) + config.monthlyContribution;

      // Ensure balance doesn't go negative
      balance = Math.max(0, balance);

      monthlyValues.push(balance);
    }

    return {
      finalValue: balance,
      monthlyValues,
    };
  }

  /**
   * Run simulation with market shocks (scenario analysis)
   */
  simulateWithShocks(
    config: MonteCarloConfig,
    shocks: MarketShock[]
  ): SimulationResult {
    this.logger.log(`Running scenario simulation with ${shocks.length} market shocks`);

    const monthlyReturn = StatisticsUtil.monthlyReturn(config.expectedReturn);
    const monthlyVolatility = StatisticsUtil.monthlyVolatility(config.volatility);

    const finalValues: number[] = [];
    const allTimeSeries: number[][] = Array(config.months + 1).fill(null).map(() => []);

    for (let iteration = 0; iteration < config.iterations; iteration++) {
      const result = this.runSingleIteration(
        config,
        monthlyReturn,
        monthlyVolatility,
        shocks
      );

      finalValues.push(result.finalValue);

      result.monthlyValues.forEach((value, monthIndex) => {
        allTimeSeries[monthIndex].push(value);
      });
    }

    const timeSeries: MonthlySnapshot[] = allTimeSeries.map((values, month) => ({
      month,
      median: StatisticsUtil.median(values),
      mean: StatisticsUtil.mean(values),
      p10: StatisticsUtil.percentile(values, 0.10),
      p90: StatisticsUtil.percentile(values, 0.90),
    }));

    const summary = StatisticsUtil.summary(finalValues);

    return {
      finalValues,
      median: summary.median,
      mean: summary.mean,
      stdDev: summary.stdDev,
      p10: summary.p10,
      p25: summary.p25,
      p75: summary.p75,
      p90: summary.p90,
      min: summary.min,
      max: summary.max,
      timeSeries,
      config,
      computedAt: new Date(),
    };
  }

  /**
   * Calculate probability of reaching a target amount
   */
  calculateSuccessRate(finalValues: number[], targetAmount: number): number {
    const successfulIterations = finalValues.filter(value => value >= targetAmount).length;
    return successfulIterations / finalValues.length;
  }

  /**
   * Calculate expected shortfall (average amount short of target when target is not met)
   */
  calculateExpectedShortfall(finalValues: number[], targetAmount: number): number {
    const shortfalls = finalValues
      .filter(value => value < targetAmount)
      .map(value => targetAmount - value);

    if (shortfalls.length === 0) return 0;

    return StatisticsUtil.mean(shortfalls);
  }

  /**
   * Find required monthly contribution for desired success rate
   * Uses binary search to find the contribution amount
   */
  findRequiredContribution(
    config: Omit<MonteCarloConfig, 'monthlyContribution'>,
    targetAmount: number,
    desiredSuccessRate: number,
    tolerance: number = 0.01
  ): number {
    this.logger.log(`Finding required contribution for ${desiredSuccessRate * 100}% success rate`);

    let low = 0;
    let high = targetAmount / config.months; // Upper bound estimate
    let iterations = 0;
    const maxIterations = 20;

    while (iterations < maxIterations && high - low > 10) {
      const mid = (low + high) / 2;

      const result = this.simulate({
        ...config,
        monthlyContribution: mid,
        iterations: 1000, // Use fewer iterations for speed
      });

      const successRate = this.calculateSuccessRate(result.finalValues, targetAmount);

      if (Math.abs(successRate - desiredSuccessRate) < tolerance) {
        return mid;
      }

      if (successRate < desiredSuccessRate) {
        low = mid;
      } else {
        high = mid;
      }

      iterations++;
    }

    return (low + high) / 2;
  }

  /**
   * Get market shock return for a given month
   */
  private getShockReturn(month: number, shocks?: MarketShock[]): number | null {
    if (!shocks || shocks.length === 0) return null;

    for (const shock of shocks) {
      const shockEnd = shock.startMonth + shock.durationMonths;
      const recoveryEnd = shockEnd + shock.recoveryMonths;

      // During shock period
      if (month >= shock.startMonth && month < shockEnd) {
        // Distribute shock evenly over duration
        return shock.magnitude / shock.durationMonths;
      }

      // During recovery period
      if (month >= shockEnd && month < recoveryEnd) {
        // Gradual recovery (linear interpolation back to 0)
        const recoveryProgress = (month - shockEnd) / shock.recoveryMonths;
        const recoveryReturn = -shock.magnitude / shock.recoveryMonths;
        return recoveryReturn * (1 - recoveryProgress);
      }
    }

    return null;
  }

  /**
   * Validate simulation configuration
   */
  private validateConfig(config: MonteCarloConfig): void {
    if (config.initialBalance < 0) {
      throw new Error('Initial balance cannot be negative');
    }

    if (config.months <= 0) {
      throw new Error('Months must be positive');
    }

    if (config.iterations <= 0) {
      throw new Error('Iterations must be positive');
    }

    if (config.volatility < 0) {
      throw new Error('Volatility cannot be negative');
    }

    if (config.iterations > 50000) {
      this.logger.warn(`High iteration count (${config.iterations}). Consider reducing for performance.`);
    }
  }

  /**
   * Apply scenario modifications to base config
   */
  applyScenario(baseConfig: MonteCarloConfig, scenario: ScenarioConfig): MonteCarloConfig {
    const modifiedConfig = { ...baseConfig };

    if (scenario.returnAdjustment) {
      modifiedConfig.expectedReturn += scenario.returnAdjustment;
    }

    if (scenario.volatilityMultiplier) {
      modifiedConfig.volatility *= scenario.volatilityMultiplier;
    }

    return modifiedConfig;
  }

  /**
   * Predefined market scenarios
   */
  static readonly SCENARIOS = {
    BEAR_MARKET: {
      name: 'Bear Market',
      description: '30% decline over 6 months with 12 month recovery',
      shocks: [
        {
          type: 'crash' as const,
          magnitude: -0.30,
          startMonth: 12,
          durationMonths: 6,
          recoveryMonths: 12,
        },
      ],
    },
    GREAT_RECESSION: {
      name: 'Great Recession (2008-style)',
      description: '50% decline over 12 months with 24 month recovery',
      shocks: [
        {
          type: 'crash' as const,
          magnitude: -0.50,
          startMonth: 24,
          durationMonths: 12,
          recoveryMonths: 24,
        },
      ],
    },
    DOT_COM_BUST: {
      name: 'Dot-com Bust (2000-style)',
      description: '45% decline over 18 months with 36 month recovery',
      shocks: [
        {
          type: 'crash' as const,
          magnitude: -0.45,
          startMonth: 6,
          durationMonths: 18,
          recoveryMonths: 36,
        },
      ],
    },
    MILD_RECESSION: {
      name: 'Mild Recession',
      description: '15% decline over 3 months with 6 month recovery',
      shocks: [
        {
          type: 'recession' as const,
          magnitude: -0.15,
          startMonth: 18,
          durationMonths: 3,
          recoveryMonths: 6,
        },
      ],
    },
    MARKET_CORRECTION: {
      name: 'Market Correction',
      description: '10% decline over 1 month with 3 month recovery',
      shocks: [
        {
          type: 'correction' as const,
          magnitude: -0.10,
          startMonth: 36,
          durationMonths: 1,
          recoveryMonths: 3,
        },
      ],
    },
  };
}
