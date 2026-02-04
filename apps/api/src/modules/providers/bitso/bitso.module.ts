import { Module } from '@nestjs/common';

import { CryptoModule } from '../../../core/crypto/crypto.module';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { BillingModule } from '../../billing/billing.module';
import { SpacesModule } from '../../spaces/spaces.module';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';

import { BitsoController } from './bitso.controller';
import { BitsoService } from './bitso.service';

@Module({
  imports: [PrismaModule, CryptoModule, SpacesModule, OrchestratorModule, BillingModule],
  controllers: [BitsoController],
  providers: [BitsoService],
  exports: [BitsoService],
})
export class BitsoModule {}
