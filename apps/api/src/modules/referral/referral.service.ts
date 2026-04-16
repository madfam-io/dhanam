import { randomBytes } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';

/**
 * Product prefix map for referral code generation.
 * Codes follow the pattern: {PREFIX}-{8 random alphanumeric}
 */
const PRODUCT_PREFIX_MAP: Record<string, string> = {
  karafiel: 'KRF',
  dhanam: 'DHN',
  selva: 'SLV',
  fortuna: 'FRT',
  tezca: 'TZC',
  janua: 'JNA',
};

/**
 * Common disposable email domain patterns.
 * Lightweight check without external dependencies.
 */
const DISPOSABLE_EMAIL_PATTERNS = [
  /^.*@(mailinator|guerrillamail|tempmail|throwaway|yopmail|sharklasers|grr\.la|guerrillamailblock)\./i,
  /^.*@(10minutemail|trashmail|fakeinbox|maildrop|dispostable|mailnesia|tempr\.email)\./i,
  /^.*@(getnada|mohmal|burnermail|mailcatch|tmail\.ws|harakirimail)\./i,
];

/**
 * =============================================================================
 * Referral Service
 * =============================================================================
 * Core referral business logic: code generation, validation, application,
 * lifecycle event tracking, and referrer dashboard stats.
 *
 * ## Anti-Abuse Measures
 * - Self-referral prevention (referrer cannot use own code)
 * - Same-domain email detection (blocks referrals within the same org)
 * - Disposable email rejection
 * - Code usage limit enforcement
 * - Code expiration checks
 *
 * @see ReferralRewardService - reward calculation and application
 * @see AmbassadorService - tier management
 * =============================================================================
 */
@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Code Generation ─────────────────────────────────────────────────

  /**
   * Get an existing referral code for the user or create a new one.
   * Each user gets one default code per source product.
   */
  async getOrCreateCode(
    userId: string,
    email: string,
    sourceProduct: string,
    targetProduct?: string
  ): Promise<{ code: string; isNew: boolean }> {
    // Check for existing code for this user + source product
    const existing = await this.prisma.referralCode.findFirst({
      where: {
        referrerUserId: userId,
        sourceProduct,
        targetProduct: targetProduct ?? null,
        isActive: true,
      },
    });

    if (existing) {
      return { code: existing.code, isNew: false };
    }

    const prefix = PRODUCT_PREFIX_MAP[sourceProduct] || 'MADFAM';
    const code = await this.generateUniqueCode(prefix);

    await this.prisma.referralCode.create({
      data: {
        code,
        referrerUserId: userId,
        referrerEmail: email,
        sourceProduct,
        targetProduct: targetProduct ?? null,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    });

    this.logger.log(`Created referral code ${code} for user ${userId} (${sourceProduct})`);
    return { code, isNew: true };
  }

  /**
   * Generate a product-specific referral code for the user.
   * Unlike getOrCreateCode, this always creates a new code.
   */
  async generateCode(
    userId: string,
    email: string,
    sourceProduct: string,
    targetProduct?: string
  ): Promise<string> {
    const prefix = PRODUCT_PREFIX_MAP[sourceProduct] || 'MADFAM';
    const code = await this.generateUniqueCode(prefix);

    await this.prisma.referralCode.create({
      data: {
        code,
        referrerUserId: userId,
        referrerEmail: email,
        sourceProduct,
        targetProduct: targetProduct ?? null,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    this.logger.log(`Generated referral code ${code} for user ${userId} (${sourceProduct})`);
    return code;
  }

  // ─── Validation ──────────────────────────────────────────────────────

  /**
   * Validate a referral code: exists, active, not expired, not maxed out.
   */
  async validateCode(code: string): Promise<{
    valid: boolean;
    reason?: string;
    referralCode?: {
      code: string;
      sourceProduct: string;
      targetProduct: string | null;
      referrerEmail: string;
    };
  }> {
    const referralCode = await this.prisma.referralCode.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        isActive: true,
        usageCount: true,
        maxUsages: true,
        expiresAt: true,
        sourceProduct: true,
        targetProduct: true,
        referrerEmail: true,
      },
    });

    if (!referralCode) {
      return { valid: false, reason: 'Code not found' };
    }

    if (!referralCode.isActive) {
      return { valid: false, reason: 'Code is no longer active' };
    }

    if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
      return { valid: false, reason: 'Code has expired' };
    }

    if (referralCode.usageCount >= referralCode.maxUsages) {
      return { valid: false, reason: 'Code has reached its maximum usage limit' };
    }

    return {
      valid: true,
      referralCode: {
        code: referralCode.code,
        sourceProduct: referralCode.sourceProduct,
        targetProduct: referralCode.targetProduct,
        referrerEmail: referralCode.referrerEmail,
      },
    };
  }

  /**
   * Get landing page data for a referral code (public, no auth).
   * Returns referrer display name and product info for the landing page.
   */
  async getLandingData(code: string): Promise<{
    valid: boolean;
    referrerDisplayName?: string;
    sourceProduct?: string;
    targetProduct?: string | null;
  }> {
    const referralCode = await this.prisma.referralCode.findUnique({
      where: { code },
      select: {
        isActive: true,
        expiresAt: true,
        usageCount: true,
        maxUsages: true,
        sourceProduct: true,
        targetProduct: true,
        referrer: {
          select: { name: true, email: true },
        },
      },
    });

    if (!referralCode) {
      return { valid: false };
    }

    if (
      !referralCode.isActive ||
      (referralCode.expiresAt && referralCode.expiresAt < new Date()) ||
      referralCode.usageCount >= referralCode.maxUsages
    ) {
      return { valid: false };
    }

    // Derive display name: use the name if available, otherwise mask the email
    const displayName = referralCode.referrer.name || this.maskEmail(referralCode.referrer.email);

    return {
      valid: true,
      referrerDisplayName: displayName,
      sourceProduct: referralCode.sourceProduct,
      targetProduct: referralCode.targetProduct,
    };
  }

  // ─── Application ─────────────────────────────────────────────────────

  /**
   * Apply a referral code during signup. Creates a Referral row and
   * increments the code's usage counter within a transaction.
   */
  async applyCode(
    code: string,
    referredEmail: string,
    targetProduct: string,
    userId?: string,
    utmParams?: { source?: string; medium?: string; campaign?: string },
    ip?: string,
    userAgent?: string
  ): Promise<{ referralId: string }> {
    // Validate the code first
    const validation = await this.validateCode(code);
    if (!validation.valid) {
      throw new BadRequestException(validation.reason);
    }

    const referralCode = await this.prisma.referralCode.findUnique({
      where: { code },
      select: {
        id: true,
        referrerUserId: true,
        referrerEmail: true,
        targetProduct: true,
      },
    });

    if (!referralCode) {
      throw new NotFoundException('Referral code not found');
    }

    // Anti-abuse: self-referral check
    if (userId && referralCode.referrerUserId === userId) {
      throw new BadRequestException('Cannot use your own referral code');
    }

    if (referralCode.referrerEmail.toLowerCase() === referredEmail.toLowerCase()) {
      throw new BadRequestException('Cannot use your own referral code');
    }

    // Anti-abuse: same-org domain check
    const referrerDomain = this.extractDomain(referralCode.referrerEmail);
    const referredDomain = this.extractDomain(referredEmail);
    if (referrerDomain === referredDomain && !this.isCommonEmailDomain(referrerDomain)) {
      throw new BadRequestException('Referral codes cannot be used within the same organization');
    }

    // Anti-abuse: disposable email check
    if (this.isDisposableEmail(referredEmail)) {
      throw new BadRequestException('Disposable email addresses are not allowed');
    }

    // Product targeting check
    if (referralCode.targetProduct && referralCode.targetProduct !== targetProduct) {
      throw new BadRequestException(
        `This referral code is only valid for ${referralCode.targetProduct}`
      );
    }

    // Check for duplicate referral (same code + same email)
    const existing = await this.prisma.referral.findUnique({
      where: {
        referralCodeId_referredEmail: {
          referralCodeId: referralCode.id,
          referredEmail: referredEmail.toLowerCase(),
        },
      },
    });

    if (existing) {
      throw new ConflictException('This referral code has already been applied for this email');
    }

    // Create referral and increment usage count in a transaction
    const referral = await this.prisma.$transaction(async (tx) => {
      const ref = await tx.referral.create({
        data: {
          referralCodeId: referralCode.id,
          referredEmail: referredEmail.toLowerCase(),
          referredUserId: userId ?? null,
          targetProduct,
          status: 'applied',
          signedUpAt: new Date(),
          utmSource: utmParams?.source ?? null,
          utmMedium: utmParams?.medium ?? null,
          utmCampaign: utmParams?.campaign ?? null,
          ipAddress: ip ?? null,
          userAgent: userAgent ?? null,
        },
      });

      await tx.referralCode.update({
        where: { id: referralCode.id },
        data: { usageCount: { increment: 1 } },
      });

      return ref;
    });

    this.logger.log(
      `Referral applied: code=${code} referred=${referredEmail} product=${targetProduct}`
    );

    return { referralId: referral.id };
  }

  // ─── Lifecycle Events ────────────────────────────────────────────────

  /**
   * Report a lifecycle event for a referral (click, signup, trial_started, converted).
   * Called by ecosystem services via the HMAC-authenticated events endpoint.
   */
  async reportEvent(event: {
    event: 'click' | 'signup' | 'trial_started' | 'converted';
    code: string;
    referredEmail: string;
    referredUserId?: string;
    targetProduct: string;
    subscriptionId?: string;
  }): Promise<{ updated: boolean }> {
    const referralCode = await this.prisma.referralCode.findUnique({
      where: { code: event.code },
      select: { id: true },
    });

    if (!referralCode) {
      this.logger.warn(`Referral event for unknown code: ${event.code}`);
      return { updated: false };
    }

    // Find the referral row
    const referral = await this.prisma.referral.findUnique({
      where: {
        referralCodeId_referredEmail: {
          referralCodeId: referralCode.id,
          referredEmail: event.referredEmail.toLowerCase(),
        },
      },
    });

    if (!referral) {
      // For click events, we might not have a referral yet. Create a pending one.
      if (event.event === 'click') {
        await this.prisma.$transaction(async (tx) => {
          // Check for existing to avoid race conditions
          const existing = await tx.referral.findUnique({
            where: {
              referralCodeId_referredEmail: {
                referralCodeId: referralCode.id,
                referredEmail: event.referredEmail.toLowerCase(),
              },
            },
          });

          if (!existing) {
            await tx.referral.create({
              data: {
                referralCodeId: referralCode.id,
                referredEmail: event.referredEmail.toLowerCase(),
                referredUserId: event.referredUserId ?? null,
                targetProduct: event.targetProduct,
                status: 'pending',
                clickedAt: new Date(),
              },
            });

            await tx.referralCode.update({
              where: { id: referralCode.id },
              data: { usageCount: { increment: 1 } },
            });
          }
        });

        return { updated: true };
      }

      this.logger.warn(`No referral found for code=${event.code} email=${event.referredEmail}`);
      return { updated: false };
    }

    // Status transition map: only allow forward progression
    const statusOrder = ['pending', 'applied', 'trial_started', 'converted', 'rewarded'];
    const eventToStatus: Record<string, string> = {
      click: 'pending',
      signup: 'applied',
      trial_started: 'trial_started',
      converted: 'converted',
    };

    const targetStatus = eventToStatus[event.event];
    const currentIndex = statusOrder.indexOf(referral.status);
    const targetIndex = statusOrder.indexOf(targetStatus);

    // Do not allow backward transitions
    if (targetIndex <= currentIndex) {
      this.logger.debug(
        `Skipping ${event.event} for referral ${referral.id}: already at ${referral.status}`
      );
      return { updated: false };
    }

    // Build the update data based on the event type
    const updateData: Record<string, any> = {
      status: targetStatus,
    };

    if (event.referredUserId) {
      updateData.referredUserId = event.referredUserId;
    }

    switch (event.event) {
      case 'signup':
        updateData.signedUpAt = new Date();
        break;
      case 'trial_started':
        updateData.trialStartedAt = new Date();
        break;
      case 'converted':
        updateData.convertedAt = new Date();
        if (event.subscriptionId) {
          updateData.metadata = {
            ...((referral.metadata as Record<string, unknown>) ?? {}),
            subscriptionId: event.subscriptionId,
          };
        }
        break;
    }

    await this.prisma.referral.update({
      where: { id: referral.id },
      data: updateData,
    });

    this.logger.log(`Referral ${referral.id} transitioned to ${targetStatus} via ${event.event}`);

    return { updated: true };
  }

  // ─── Dashboard Stats ─────────────────────────────────────────────────

  /**
   * Get aggregate referral statistics for the referrer dashboard.
   */
  async getStats(userId: string): Promise<{
    totalCodes: number;
    totalReferrals: number;
    pendingReferrals: number;
    convertedReferrals: number;
    rewardedReferrals: number;
    conversionRate: number;
  }> {
    const codes = await this.prisma.referralCode.findMany({
      where: { referrerUserId: userId },
      select: { id: true },
    });

    if (codes.length === 0) {
      return {
        totalCodes: 0,
        totalReferrals: 0,
        pendingReferrals: 0,
        convertedReferrals: 0,
        rewardedReferrals: 0,
        conversionRate: 0,
      };
    }

    const codeIds = codes.map((c) => c.id);

    const [total, pending, converted, rewarded] = await Promise.all([
      this.prisma.referral.count({
        where: { referralCodeId: { in: codeIds } },
      }),
      this.prisma.referral.count({
        where: { referralCodeId: { in: codeIds }, status: { in: ['pending', 'applied'] } },
      }),
      this.prisma.referral.count({
        where: { referralCodeId: { in: codeIds }, status: 'converted' },
      }),
      this.prisma.referral.count({
        where: { referralCodeId: { in: codeIds }, status: 'rewarded' },
      }),
    ]);

    return {
      totalCodes: codes.length,
      totalReferrals: total,
      pendingReferrals: pending,
      convertedReferrals: converted,
      rewardedReferrals: rewarded,
      conversionRate: total > 0 ? Math.round(((converted + rewarded) / total) * 100) / 100 : 0,
    };
  }

  /**
   * Get reward history for a user (as recipient).
   */
  async getRewards(userId: string): Promise<
    Array<{
      id: string;
      rewardType: string;
      amount: number;
      description: string;
      applied: boolean;
      appliedAt: Date | null;
      createdAt: Date;
    }>
  > {
    return this.prisma.referralReward.findMany({
      where: { recipientUserId: userId },
      select: {
        id: true,
        rewardType: true,
        amount: true,
        description: true,
        applied: true,
        appliedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Private Helpers ─────────────────────────────────────────────────

  /**
   * Generate a unique referral code with the given prefix.
   * Format: {PREFIX}-{8 random alphanumeric uppercase}
   * Retries up to 5 times on collision.
   */
  private async generateUniqueCode(prefix: string): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const random = randomBytes(5).toString('hex').toUpperCase().slice(0, 8);
      const code = `${prefix}-${random}`;

      const existing = await this.prisma.referralCode.findUnique({
        where: { code },
        select: { id: true },
      });

      if (!existing) {
        return code;
      }
    }

    throw new ConflictException('Failed to generate a unique referral code after 5 attempts');
  }

  /**
   * Extract domain from an email address.
   */
  private extractDomain(email: string): string {
    return email.split('@')[1]?.toLowerCase() ?? '';
  }

  /**
   * Check if a domain is a common public email provider (not corporate).
   */
  private isCommonEmailDomain(domain: string): boolean {
    const commonDomains = new Set([
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'live.com',
      'icloud.com',
      'proton.me',
      'protonmail.com',
      'aol.com',
      'zoho.com',
      'mail.com',
      'fastmail.com',
      'tutanota.com',
    ]);
    return commonDomains.has(domain);
  }

  /**
   * Check if an email appears to be from a disposable email service.
   */
  private isDisposableEmail(email: string): boolean {
    return DISPOSABLE_EMAIL_PATTERNS.some((pattern) => pattern.test(email));
  }

  /**
   * Mask an email for public display: show first 2 chars + *** + @domain.
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***';
    const visible = local.slice(0, 2);
    return `${visible}***@${domain}`;
  }
}
