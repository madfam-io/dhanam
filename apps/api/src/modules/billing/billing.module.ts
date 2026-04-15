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
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuditModule } from '../../core/audit/audit.module';
import { PrismaModule } from '../../core/prisma/prisma.module';

import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { CotizaWebhookController } from './cotiza-webhook.controller';
import { CreditBillingController } from './credit-billing.controller';
import { CustomerFederationController } from './customer-federation.controller';
import { FeatureGateGuard } from './guards/feature-gate.guard';
import { FederationAuthGuard } from './guards/federation-auth.guard';
import { ProviderConnectionGuard } from './guards/provider-connection.guard';
import { SpaceLimitGuard } from './guards/space-limit.guard';
import { SubscriptionGuard } from './guards/subscription.guard';
import { UsageLimitGuard } from './guards/usage-limit.guard';
import { UsageTrackingInterceptor } from './interceptors/usage-tracking.interceptor';
import { JanuaBillingService } from './janua-billing.service';
import { ReconciliationJob } from './jobs/reconciliation.job';
import { SubscriptionLifecycleJob } from './jobs/subscription-lifecycle.job';
// Federation (PhyneCRM integration)
import { CustomerFederationService } from './services/customer-federation.service';
// Hybrid Router Services (Stripe MX + Paddle)
import { PaddleService } from './services/paddle.service';
import { PaymentRouterService } from './services/payment-router.service';
import { PriceResolverService } from './services/price-resolver.service';
import { PricingEngineService } from './services/pricing-engine.service';
import { StripeMxService } from './services/stripe-mx.service';
// Extracted sub-services (usage, lifecycle, webhooks)
import { SubscriptionLifecycleService } from './services/subscription-lifecycle.service';
import { TrialService } from './services/trial.service';
import { UsageMeteringService } from './services/usage-metering.service';
import { UsageTrackingService } from './services/usage-tracking.service';
import { WebhookProcessorService } from './services/webhook-processor.service';
import { StripeService } from './stripe.service';

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
  controllers: [
    BillingController,
    CreditBillingController,
    CustomerFederationController,
    CotizaWebhookController,
  ],
  providers: [
    // Core billing services
    BillingService,
    JanuaBillingService,
    StripeService,

    // Extracted sub-services
    UsageMeteringService,
    UsageTrackingService,
    SubscriptionLifecycleService,
    WebhookProcessorService,

    // Pricing & trial lifecycle
    PriceResolverService,
    PricingEngineService,
    TrialService,
    SubscriptionLifecycleJob,
    ReconciliationJob,

    // Hybrid Router (Stripe MX + Paddle)
    PaymentRouterService,
    StripeMxService,
    PaddleService,

    // Federation (PhyneCRM)
    CustomerFederationService,
    FederationAuthGuard,

    // Guards and interceptors
    SubscriptionGuard,
    UsageLimitGuard,
    SpaceLimitGuard,
    ProviderConnectionGuard,
    FeatureGateGuard,
    UsageTrackingInterceptor,
  ],
  exports: [
    BillingService,
    JanuaBillingService,
    StripeService,
    PriceResolverService,
    PricingEngineService,
    TrialService,
    PaymentRouterService,
    StripeMxService,
    PaddleService,
    CustomerFederationService,
    UsageMeteringService,
    UsageTrackingService,
    SubscriptionLifecycleService,
    WebhookProcessorService,
    SubscriptionGuard,
    UsageLimitGuard,
    SpaceLimitGuard,
    ProviderConnectionGuard,
    FeatureGateGuard,
    UsageTrackingInterceptor,
  ],
})
export class BillingModule {}
