import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';

import { SimulationsService } from './simulations.service';
import { SimulationsController } from './simulations.controller';

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [SimulationsController],
  providers: [SimulationsService],
  exports: [SimulationsService],
})
export class SimulationsModule {}
