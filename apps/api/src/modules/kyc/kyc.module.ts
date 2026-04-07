/**
 * =============================================================================
 * Dhanam KYC / AML Module
 * =============================================================================
 * Provides CNBV-compliant identity verification via MetaMap for the
 * Dhanam financial platform.
 *
 * Features:
 * - MetaMap integration for identity verification flows
 * - PEP (Politically Exposed Person) screening
 * - Sanctions list matching
 * - CURP and INE document validation (Mexico-specific)
 * - Webhook processing with HMAC-SHA256 signature verification
 * - KycVerifiedGuard for protecting regulated endpoints
 *
 * The KycVerifiedGuard is exported so other modules (e.g., TransactionExecution)
 * can use it to gate financial operations behind identity verification.
 * =============================================================================
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../../core/prisma/prisma.module';

import { KycVerifiedGuard } from './guards/kyc-verified.guard';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { MetaMapProvider } from './metamap.provider';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [KycController],
  providers: [KycService, MetaMapProvider, KycVerifiedGuard],
  exports: [KycService, KycVerifiedGuard],
})
export class KycModule {}
