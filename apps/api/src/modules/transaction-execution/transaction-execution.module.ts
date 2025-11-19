import { Module } from '@nestjs/common';
import { TransactionExecutionController } from './transaction-execution.controller';
import { TransactionExecutionService } from './transaction-execution.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuditModule } from '../../core/audit/audit.module';
import { SpacesModule } from '../spaces/spaces.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [PrismaModule, AuditModule, SpacesModule, BillingModule],
  controllers: [TransactionExecutionController],
  providers: [TransactionExecutionService],
  exports: [TransactionExecutionService],
})
export class TransactionExecutionModule {}
