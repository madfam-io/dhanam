import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';

import { SimulationsService } from './simulations.service';
import { SimulationsController } from './simulations.controller';
import { MonteCarloEngine } from './engines/monte-carlo.engine';

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [SimulationsController],
  providers: [SimulationsService, MonteCarloEngine],
  exports: [SimulationsService, MonteCarloEngine],
})
export class SimulationsModule {}
