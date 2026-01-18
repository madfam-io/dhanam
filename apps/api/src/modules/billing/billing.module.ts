/**
 * =============================================================================
 * Dhanam Billing Module
 * =============================================================================
 * Provides multi-provider payment processing for the Galaxy ecosystem.
 *
 * Hybrid Router Strategy:
 * - Mexico (MX): Stripe Mexico (MXN, OXXO, SPEI)
 * - Global: Paddle (Merchant of Record, USD/EUR, PayPal, Apple/Google Pay)
 *
 * This enables optimal payment experience based on customer geography:
 * - Native currency pricing (no FX fees for Mexican users)
 * - Local payment methods (OXXO cash, SPEI bank transfers)
 * - Global tax compliance via Paddle MoR
 * =============================================================================
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { AuditModule } from '../../core/audit/audit.module';
import { PrismaModule } from '../../core/prisma/prisma.module';

import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { JanuaBillingService } from './janua-billing.service';
import { SubscriptionGuard } from './guards/subscription.guard';
import { UsageLimitGuard } from './guards/usage-limit.guard';
import { UsageTrackingInterceptor } from './interceptors/usage-tracking.interceptor';
import { StripeService } from './stripe.service';

// Hybrid Router Services (Stripe MX + Paddle)
import { PaymentRouterService } from './services/payment-router.service';
import { StripeMxService } from './services/stripe-mx.service';
import { PaddleService } from './services/paddle.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuditModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [BillingController],
  providers: [
    // Core billing services
    BillingService,
    JanuaBillingService,
    StripeService,

    // Hybrid Router (Stripe MX + Paddle)
    PaymentRouterService,
    StripeMxService,
    PaddleService,

    // Guards and interceptors
    SubscriptionGuard,
    UsageLimitGuard,
    UsageTrackingInterceptor,
  ],
  exports: [
    BillingService,
    JanuaBillingService,
    StripeService,
    PaymentRouterService,
    StripeMxService,
    PaddleService,
    SubscriptionGuard,
    UsageLimitGuard,
    UsageTrackingInterceptor,
  ],
})
export class BillingModule {}
