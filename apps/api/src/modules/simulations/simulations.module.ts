import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';

import { MonteCarloEngine } from './engines/monte-carlo.engine';
import { SimulationsController } from './simulations.controller';
import { SimulationsService } from './simulations.service';

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [SimulationsController],
  providers: [SimulationsService, MonteCarloEngine],
  exports: [SimulationsService, MonteCarloEngine],
})
export class SimulationsModule {}
