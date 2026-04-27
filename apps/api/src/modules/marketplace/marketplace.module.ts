import { Module, forwardRef } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { WebhookOutboundModule } from '../webhook-outbound/webhook-outbound.module';

import { MarketplaceController } from './marketplace.controller';
import { ChargeService } from './services/charge.service';
import { ConnectWebhookHandler } from './services/connect-webhook.handler';
import { DisputeService } from './services/dispute.service';
import { MerchantService } from './services/merchant.service';
import { PayoutService } from './services/payout.service';
import { TransferService } from './services/transfer.service';

@Module({
  imports: [PrismaModule, forwardRef(() => BillingModule), WebhookOutboundModule],
  controllers: [MarketplaceController],
  providers: [
    MerchantService,
    ChargeService,
    TransferService,
    PayoutService,
    DisputeService,
    ConnectWebhookHandler,
  ],
  exports: [
    MerchantService,
    ChargeService,
    TransferService,
    PayoutService,
    DisputeService,
    ConnectWebhookHandler,
  ],
})
export class MarketplaceModule {}
