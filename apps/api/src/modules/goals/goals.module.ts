import { Module } from '@nestjs/common';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { GoalsExecutionService } from './goals-execution.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuditModule } from '../../core/audit/audit.module';
import { TransactionExecutionModule } from '../transaction-execution/transaction-execution.module';

@Module({
  imports: [PrismaModule, AuditModule, TransactionExecutionModule],
  controllers: [GoalsController],
  providers: [GoalsService, GoalsExecutionService],
  exports: [GoalsService, GoalsExecutionService],
})
export class GoalsModule {}
