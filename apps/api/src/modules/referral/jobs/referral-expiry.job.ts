import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../../../core/prisma/prisma.service';

/**
 * =============================================================================
 * Referral Expiry Job
 * =============================================================================
 * Daily cron job that deactivates expired referral codes and marks stale
 * pending referrals as expired.
 *
 * Runs daily at 4:00 AM UTC (after the billing reconciliation at 3:00 AM).
 *
 * ## Actions
 * 1. Deactivate referral codes past their expiresAt date
 * 2. Expire pending/applied referrals older than 90 days that never converted
 * =============================================================================
 */
@Injectable()
export class ReferralExpiryJob {
  private readonly logger = new Logger(ReferralExpiryJob.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Daily expiry sweep at 4:00 AM UTC.
   */
  @Cron('0 4 * * *', { name: 'referral-expiry' })
  async expireStaleReferrals(): Promise<void> {
    this.logger.log('Starting referral expiry sweep');

    const now = new Date();

    // 1. Deactivate expired referral codes
    const deactivatedCodes = await this.prisma.referralCode.updateMany({
      where: {
        isActive: true,
        expiresAt: { lt: now },
      },
      data: { isActive: false },
    });

    if (deactivatedCodes.count > 0) {
      this.logger.log(`Deactivated ${deactivatedCodes.count} expired referral codes`);
    }

    // 2. Expire stale referrals (pending or applied for 90+ days without conversion)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const expiredReferrals = await this.prisma.referral.updateMany({
      where: {
        status: { in: ['pending', 'applied'] },
        createdAt: { lt: ninetyDaysAgo },
      },
      data: { status: 'expired' },
    });

    if (expiredReferrals.count > 0) {
      this.logger.log(`Expired ${expiredReferrals.count} stale referrals (90+ days)`);
    }

    this.logger.log(
      `Referral expiry sweep complete: ${deactivatedCodes.count} codes deactivated, ${expiredReferrals.count} referrals expired`
    );
  }
}
