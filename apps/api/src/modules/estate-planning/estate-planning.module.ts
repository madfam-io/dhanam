import { Module } from '@nestjs/common';
import { EstatePlanningController } from './estate-planning.controller';
import { EstatePlanningService } from './estate-planning.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuditModule } from '../../core/audit/audit.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [PrismaModule, AuditModule, BillingModule],
  controllers: [EstatePlanningController],
  providers: [EstatePlanningService],
  exports: [EstatePlanningService],
})
export class EstatePlanningModule {}
