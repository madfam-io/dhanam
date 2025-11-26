import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuditModule } from '../../core/audit/audit.module';
import { PrismaModule } from '../../core/prisma/prisma.module';

import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { JanuaBillingService } from './janua-billing.service';
import { SubscriptionGuard } from './guards/subscription.guard';
import { UsageLimitGuard } from './guards/usage-limit.guard';
import { UsageTrackingInterceptor } from './interceptors/usage-tracking.interceptor';
import { StripeService } from './stripe.service';

@Module({
  imports: [ConfigModule, PrismaModule, AuditModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    JanuaBillingService,
    StripeService,
    SubscriptionGuard,
    UsageLimitGuard,
    UsageTrackingInterceptor,
  ],
  exports: [
    BillingService,
    JanuaBillingService,
    StripeService,
    SubscriptionGuard,
    UsageLimitGuard,
    UsageTrackingInterceptor,
  ],
})
export class BillingModule {}
