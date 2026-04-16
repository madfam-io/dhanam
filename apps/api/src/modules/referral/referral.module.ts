/**
 * =============================================================================
 * Dhanam Referral Module
 * =============================================================================
 * Provides the referral and ambassador system for the MADFAM ecosystem.
 *
 * ## Features
 * - Referral code generation with product-specific prefixes
 * - Code validation and anti-abuse (self-referral, same-org, disposable email)
 * - Referral lifecycle tracking (pending -> applied -> trial_started -> converted -> rewarded)
 * - Reward calculation and application (subscription extensions, credit grants)
 * - Ambassador tier system (none -> bronze -> silver -> gold -> platinum)
 * - Service-to-service event reporting via HMAC-authenticated endpoint
 *
 * ## Jobs
 * - ReferralRewardJob: Processes converted referrals every 15 minutes
 * - ReferralExpiryJob: Deactivates expired codes daily at 4:00 AM UTC
 * =============================================================================
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { BillingModule } from '../billing/billing.module';

import { AmbassadorService } from './ambassador.service';
import { ReferralHmacGuard } from './guards/referral-hmac.guard';
import { ReferralExpiryJob } from './jobs/referral-expiry.job';
import { ReferralRewardJob } from './jobs/referral-reward.job';
import { ReferralRewardService } from './referral-reward.service';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';

@Module({
  imports: [ConfigModule, BillingModule],
  controllers: [ReferralController],
  providers: [
    // Core services
    ReferralService,
    ReferralRewardService,
    AmbassadorService,

    // Jobs
    ReferralRewardJob,
    ReferralExpiryJob,

    // Guards
    ReferralHmacGuard,
  ],
  exports: [ReferralService, ReferralRewardService, AmbassadorService],
})
export class ReferralModule {}
