import { Module } from '@nestjs/common';

import { AuditModule } from '../../core/audit/audit.module';
import { PrismaModule } from '../../core/database/prisma.module';
import { GoalsModule } from '../goals/goals.module';

import { MonteCarloEngine } from './engines/monte-carlo.engine';
import { SimulationsController } from './simulations.controller';
import { SimulationsService } from './simulations.service';

/**
 * Simulations Module
 *
 * Provides probabilistic financial planning capabilities:
 * - Monte Carlo simulations for portfolio growth
 * - Goal probability calculations
 * - Retirement planning simulations
 * - Scenario analysis (stress testing)
 *
 * Integrates with:
 * - Goals module for goal-based probability calculations
 * - Billing module for premium tier gating (via guards)
 * - Audit module for tracking simulation usage
 */
@Module({
  imports: [PrismaModule, AuditModule, GoalsModule],
  controllers: [SimulationsController],
  providers: [SimulationsService, MonteCarloEngine],
  exports: [SimulationsService, MonteCarloEngine],
})
export class SimulationsModule {}
