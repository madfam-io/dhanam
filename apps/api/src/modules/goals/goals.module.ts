import { Module } from '@nestjs/common';

import { AuditModule } from '../../core/audit/audit.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { TransactionExecutionModule } from '../transaction-execution/transaction-execution.module';

import { GoalsExecutionService } from './goals-execution.service';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';

@Module({
  imports: [PrismaModule, AuditModule, TransactionExecutionModule],
  controllers: [GoalsController],
  providers: [GoalsService, GoalsExecutionService],
  exports: [GoalsService, GoalsExecutionService],
})
export class GoalsModule {}
