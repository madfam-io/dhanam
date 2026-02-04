import { Module } from '@nestjs/common';

import { AuditModule } from '../../core/audit/audit.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { SimulationsModule } from '../simulations/simulations.module';
import { TransactionExecutionModule } from '../transaction-execution/transaction-execution.module';

import { GoalCollaborationService } from './goal-collaboration.service';
import { GoalProbabilityService } from './goal-probability.service';
import { GoalsExecutionService } from './goals-execution.service';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';

@Module({
  imports: [PrismaModule, AuditModule, TransactionExecutionModule, SimulationsModule, BillingModule],
  controllers: [GoalsController],
  providers: [
    GoalsService,
    GoalsExecutionService,
    GoalProbabilityService,
    GoalCollaborationService,
  ],
  exports: [GoalsService, GoalsExecutionService, GoalProbabilityService, GoalCollaborationService],
})
export class GoalsModule {}
