import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RequiresPremium } from '../billing/decorators/requires-tier.decorator';
import { TrackUsage } from '../billing/decorators/track-usage.decorator';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { UsageLimitGuard } from '../billing/guards/usage-limit.guard';

import { RunSimulationDto, CalculateGoalProbabilityDto, SimulateRetirementDto } from './dto';
import { SimulationsService } from './simulations.service';

/**
 * Simulations Controller
 *
 * Handles probabilistic financial simulations using Monte Carlo methods.
 * All endpoints require authentication and most require premium tier.
 */
@Controller('simulations')
@UseGuards(JwtAuthGuard, SubscriptionGuard, UsageLimitGuard)
export class SimulationsController {
  constructor(private simulationsService: SimulationsService) {}

  /**
   * Run basic Monte Carlo simulation
   *
   * Performs stochastic simulation of portfolio growth over time.
   * Returns distribution of possible outcomes.
   *
   * @requires Premium tier
   * @tracks monte_carlo_simulation usage
   */
  @Post('monte-carlo')
  @RequiresPremium()
  @TrackUsage('monte_carlo_simulation')
  @HttpCode(HttpStatus.OK)
  async runSimulation(@Body() dto: RunSimulationDto, @Req() _req: any) {
    return this.simulationsService.runSimulation({
      initialBalance: dto.initialBalance,
      monthlyContribution: dto.monthlyContribution,
      months: dto.months,
      iterations: dto.iterations ?? 10000,
      expectedReturn: dto.expectedReturn,
      volatility: dto.volatility,
    });
  }

  /**
   * Calculate probability of achieving a financial goal
   *
   * Runs Monte Carlo simulation specific to a goal and calculates:
   * - Probability of success
   * - Expected shortfall if goal is not met
   * - Recommended monthly contribution
   * - Confidence intervals
   *
   * @requires Premium tier
   * @tracks goal_probability usage
   */
  @Post('goal-probability')
  @RequiresPremium()
  @TrackUsage('goal_probability')
  @HttpCode(HttpStatus.OK)
  async calculateGoalProbability(@Body() dto: CalculateGoalProbabilityDto, @Req() req: any) {
    return this.simulationsService.calculateGoalProbability(
      {
        goalId: dto.goalId,
        currentValue: dto.currentValue,
        targetAmount: dto.targetAmount,
        monthsRemaining: dto.monthsRemaining,
        monthlyContribution: dto.monthlyContribution ?? 0,
        expectedReturn: dto.expectedReturn,
        volatility: dto.volatility,
        iterations: dto.iterations,
      },
      req.user.id
    );
  }

  /**
   * Simulate retirement planning
   *
   * Two-phase simulation:
   * 1. Accumulation phase (current age → retirement age)
   * 2. Withdrawal phase (retirement age → life expectancy)
   *
   * Returns probability of not running out of money and safe withdrawal rate.
   *
   * @requires Premium tier
   * @tracks monte_carlo_simulation usage
   */
  @Post('retirement')
  @RequiresPremium()
  @TrackUsage('monte_carlo_simulation')
  @HttpCode(HttpStatus.OK)
  async simulateRetirement(@Body() dto: SimulateRetirementDto, @Req() req: any) {
    return this.simulationsService.simulateRetirement(
      {
        initialBalance: dto.initialBalance,
        monthlyContribution: dto.monthlyContribution,
        currentAge: dto.currentAge,
        retirementAge: dto.retirementAge,
        lifeExpectancy: dto.lifeExpectancy,
        monthlyExpenses: dto.monthlyExpenses,
        socialSecurityIncome: dto.socialSecurityIncome,
        expectedReturn: dto.expectedReturn,
        volatility: dto.volatility,
        iterations: dto.iterations ?? 10000,
        months: 0, // Will be calculated from ages
        inflationAdjusted: dto.inflationAdjusted ?? true,
      },
      req.user.id
    );
  }

  /**
   * Compare baseline vs. stress scenario
   *
   * Runs simulation under normal conditions and compares against
   * predefined market stress scenarios (2008 crash, bear market, etc.)
   *
   * Available scenarios:
   * - BEAR_MARKET
   * - GREAT_RECESSION
   * - DOT_COM_BUST
   * - MILD_RECESSION
   * - MARKET_CORRECTION
   *
   * @requires Premium tier
   * @tracks scenario_analysis usage
   */
  @Post('scenarios/:scenarioName')
  @RequiresPremium()
  @TrackUsage('scenario_analysis')
  @HttpCode(HttpStatus.OK)
  async compareScenarios(
    @Param('scenarioName') scenarioName: string,
    @Body() dto: RunSimulationDto,
    @Req() _req: any
  ) {
    return this.simulationsService.compareScenarios(
      {
        initialBalance: dto.initialBalance,
        monthlyContribution: dto.monthlyContribution,
        months: dto.months,
        iterations: dto.iterations ?? 10000,
        expectedReturn: dto.expectedReturn,
        volatility: dto.volatility,
      },
      scenarioName.toUpperCase() as keyof typeof import('./engines/monte-carlo.engine').MonteCarloEngine.SCENARIOS
    );
  }

  /**
   * Get recommended portfolio allocation based on risk profile
   *
   * Returns expected return and volatility for different risk tolerances.
   * Does not run simulation - just provides parameters.
   *
   * @public Free tier can access this informational endpoint
   */
  @Post('recommended-allocation')
  @HttpCode(HttpStatus.OK)
  async getRecommendedAllocation(
    @Body()
    body: {
      riskTolerance: 'conservative' | 'moderate' | 'aggressive';
      yearsToRetirement: number;
    }
  ) {
    return this.simulationsService.getRecommendedAllocation(
      body.riskTolerance,
      body.yearsToRetirement
    );
  }
}
