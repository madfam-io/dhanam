import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { SubscriptionGuard } from './guards/subscription.guard';
import { UsageLimitGuard } from './guards/usage-limit.guard';
import { UsageTrackingInterceptor } from './interceptors/usage-tracking.interceptor';
import { PrismaModule } from '../../core/database/prisma.module';
import { AuditModule } from '../../core/audit/audit.module';

@Module({
  imports: [ConfigModule, PrismaModule, AuditModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    StripeService,
    SubscriptionGuard,
    UsageLimitGuard,
    UsageTrackingInterceptor,
  ],
  exports: [
    BillingService,
    StripeService,
    SubscriptionGuard,
    UsageLimitGuard,
    UsageTrackingInterceptor,
  ],
})
export class BillingModule {}
