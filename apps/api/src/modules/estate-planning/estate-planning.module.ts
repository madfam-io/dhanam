import { Module } from '@nestjs/common';

import { AuditModule } from '../../core/audit/audit.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { EmailModule } from '../email/email.module';

import { EstatePlanningController } from './estate-planning.controller';
import { EstatePlanningService } from './estate-planning.service';
import { ExecutorAccessService } from './executor-access.service';

@Module({
  imports: [PrismaModule, AuditModule, BillingModule, EmailModule],
  controllers: [EstatePlanningController],
  providers: [EstatePlanningService, ExecutorAccessService],
  exports: [EstatePlanningService, ExecutorAccessService],
})
export class EstatePlanningModule {}
