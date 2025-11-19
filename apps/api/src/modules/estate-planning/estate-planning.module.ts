import { Module } from '@nestjs/common';

import { AuditModule } from '../../core/audit/audit.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';

import { EstatePlanningController } from './estate-planning.controller';
import { EstatePlanningService } from './estate-planning.service';

@Module({
  imports: [PrismaModule, AuditModule, BillingModule],
  controllers: [EstatePlanningController],
  providers: [EstatePlanningService],
  exports: [EstatePlanningService],
})
export class EstatePlanningModule {}
