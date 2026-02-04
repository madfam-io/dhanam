import { Module } from '@nestjs/common';

import { AuditModule } from '../../../core/audit/audit.module';
import { CryptoModule } from '../../../core/crypto/crypto.module';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { BillingModule } from '../../billing/billing.module';
import { SpacesModule } from '../../spaces/spaces.module';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';

import { PlaidWebhookHandler } from './plaid-webhook.handler';
import { PlaidController } from './plaid.controller';
import { PlaidService } from './plaid.service';

@Module({
  imports: [
    PrismaModule,
    CryptoModule,
    SpacesModule,
    OrchestratorModule,
    AuditModule,
    BillingModule,
  ],
  controllers: [PlaidController],
  providers: [PlaidService, PlaidWebhookHandler],
  exports: [PlaidService],
})
export class PlaidModule {}
