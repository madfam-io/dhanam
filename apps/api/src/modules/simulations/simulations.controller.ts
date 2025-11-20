import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { UsageLimitGuard } from '../billing/guards/usage-limit.guard';
import { RequiresPremium } from '../billing/decorators/requires-tier.decorator';
import { TrackUsage } from '../billing/decorators/track-usage.decorator';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { MonitorPerformance } from '../../core/decorators/monitor-performance.decorator';

import { SimulationsService } from './simulations.service';
import {
  RunSimulationDto,
  RunRetirementSimulationDto,
  CalculateSafeWithdrawalRateDto,
  AnalyzeScenarioDto,
} from './dto';

@Controller('simulations')
@UseGuards(JwtAuthGuard)
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Post('monte-carlo')
  @RequiresPremium()
  @UseGuards(SubscriptionGuard, UsageLimitGuard)
  @TrackUsage('monte_carlo_simulation')
  @MonitorPerformance(15000)
  @HttpCode(HttpStatus.OK)
  async runSimulation(
    @CurrentUser() user: { id: string },
    @Body() dto: RunSimulationDto
  ) {
    return this.simulationsService.runSimulation(user.id, dto);
  }

  @Post('retirement')
  @RequiresPremium()
  @UseGuards(SubscriptionGuard, UsageLimitGuard)
  @TrackUsage('monte_carlo_simulation')
  @MonitorPerformance(20000)
  @HttpCode(HttpStatus.OK)
  async runRetirementSimulation(
    @CurrentUser() user: { id: string },
    @Body() dto: RunRetirementSimulationDto
  ) {
    return this.simulationsService.runRetirementSimulation(user.id, dto);
  }

  @Post('safe-withdrawal-rate')
  @RequiresPremium()
  @UseGuards(SubscriptionGuard, UsageLimitGuard)
  @TrackUsage('monte_carlo_simulation')
  @MonitorPerformance(15000)
  @HttpCode(HttpStatus.OK)
  async calculateSafeWithdrawalRate(
    @CurrentUser() user: { id: string },
    @Body() dto: CalculateSafeWithdrawalRateDto
  ) {
    return this.simulationsService.calculateSafeWithdrawalRate(user.id, dto);
  }

  @Post('scenario-analysis')
  @RequiresPremium()
  @UseGuards(SubscriptionGuard, UsageLimitGuard)
  @MonitorPerformance(30000) // Longer timeout for stress testing
  @HttpCode(HttpStatus.OK)
  async analyzeScenario(
    @CurrentUser() user: { id: string },
    @Body() dto: AnalyzeScenarioDto
  ) {
    return this.simulationsService.analyzeScenario(user.id, dto);
  }

  @Get()
  async listSimulations(
    @CurrentUser() user: { id: string },
    @Query('spaceId') spaceId?: string,
    @Query('goalId') goalId?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string
  ) {
    return this.simulationsService.listSimulations(user.id, {
      spaceId,
      goalId,
      type,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  async getSimulation(
    @CurrentUser() user: { id: string },
    @Param('id') simulationId: string
  ) {
    return this.simulationsService.getSimulation(user.id, simulationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSimulation(
    @CurrentUser() user: { id: string },
    @Param('id') simulationId: string
  ) {
    return this.simulationsService.deleteSimulation(user.id, simulationId);
  }
}
