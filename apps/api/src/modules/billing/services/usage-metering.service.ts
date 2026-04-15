import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreditsExhaustedException } from '../exceptions';

/**
 * Credit tier mapping — included credits per billing period.
 *
 * These values define the number of credits each subscription tier
 * receives per billing cycle. Services across the MADFAM ecosystem
 * report credit consumption via the usage endpoint.
 */
const TIER_CREDITS: Record<string, number> = {
  community: 100,
  essentials: 5_000,
  pro: 25_000,
  premium: 100_000,
};

/**
 * Overage billing rates per credit (USD).
 *
 * `null` means overage is not allowed — the org is blocked when
 * credits are exhausted (community/free tier).
 */
const OVERAGE_RATES: Record<string, number | null> = {
  community: null, // blocked
  essentials: 0.002,
  pro: 0.0015,
  premium: 0.001,
};

/**
 * Usage Metering Service
 *
 * Manages credit-based usage metering for the MADFAM ecosystem.
 * Services (Karafiel, Selva, Fortuna, etc.) report credit consumption
 * via HMAC-authenticated requests. Each org has a credit balance that
 * resets per billing period.
 *
 * ## Design Decisions
 * - **Idempotency**: Every usage event requires a unique idempotency key.
 *   Duplicate keys are silently skipped to prevent double-counting.
 * - **Atomic updates**: Balance updates use Prisma transactions to prevent
 *   race conditions between concurrent usage reports.
 * - **Overage policy**: Free tier is hard-blocked; paid tiers allow overage
 *   with per-credit billing rates.
 *
 * @see CreditBillingController - HTTP endpoints for this service
 * @see BillingModule - Module registration
 */
@Injectable()
export class UsageMeteringService {
  private readonly logger = new Logger(UsageMeteringService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a usage event and decrement the org's credit balance.
   *
   * Uses a Prisma transaction to ensure atomicity between creating the
   * UsageEvent and updating the CreditBalance. Idempotency keys prevent
   * double-counting — if the key already exists, the call is a no-op.
   *
   * @throws CreditsExhaustedException when a free-tier org has no credits remaining
   */
  async recordUsage(
    orgId: string,
    service: string,
    operation: string,
    credits: number,
    idempotencyKey: string
  ): Promise<{
    recorded: boolean;
    creditsRemaining: number;
    overageCredits: number;
    tier: string;
  }> {
    // Check idempotency — skip if this key was already processed
    const existing = await this.prisma.usageEvent.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      this.logger.debug(`Idempotency key already exists: ${idempotencyKey}`);
      const balance = await this.getOrCreateBalance(orgId);
      const remaining = Math.max(0, balance.creditsIncluded - balance.creditsUsed);
      return {
        recorded: false,
        creditsRemaining: remaining,
        overageCredits: balance.overageCredits,
        tier: await this.getOrgTier(orgId),
      };
    }

    // Resolve the org's tier for overage policy
    const tier = await this.getOrgTier(orgId);
    const overageRate = OVERAGE_RATES[tier] ?? null;

    // Perform the recording and balance update atomically
    const result = await this.prisma.$transaction(async (tx) => {
      // Re-check idempotency inside transaction (race condition guard)
      const duplicate = await tx.usageEvent.findUnique({
        where: { idempotencyKey },
      });
      if (duplicate) {
        const bal = await tx.creditBalance.findUnique({ where: { orgId } });
        return {
          recorded: false,
          creditsRemaining: Math.max(0, (bal?.creditsIncluded ?? 0) - (bal?.creditsUsed ?? 0)),
          overageCredits: bal?.overageCredits ?? 0,
        };
      }

      // Get or create the credit balance
      let balance = await tx.creditBalance.findUnique({ where: { orgId } });
      if (!balance) {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        balance = await tx.creditBalance.create({
          data: {
            orgId,
            creditsIncluded: TIER_CREDITS[tier] ?? TIER_CREDITS.community,
            creditsUsed: 0,
            overageCredits: 0,
            periodStart: now,
            periodEnd,
          },
        });
      }

      const remaining = balance.creditsIncluded - balance.creditsUsed;

      // Check if this usage would exceed the included credits
      if (remaining <= 0 && overageRate === null) {
        throw new CreditsExhaustedException(
          `Credit allowance exhausted for org ${orgId}. Upgrade from ${tier} tier for overage billing.`
        );
      }

      // Calculate how many credits go to included vs overage
      let addToUsed = credits;
      let addToOverage = 0;

      if (credits > remaining && remaining > 0) {
        // Partially covered by included credits
        addToUsed = remaining;
        addToOverage = credits - remaining;
      } else if (remaining <= 0) {
        // All credits are overage
        addToUsed = 0;
        addToOverage = credits;
      }

      // If overage would be created on a blocked tier, reject
      if (addToOverage > 0 && overageRate === null) {
        throw new CreditsExhaustedException(
          `Credit allowance exhausted for org ${orgId}. Upgrade from ${tier} tier for overage billing.`
        );
      }

      // Create the usage event
      await tx.usageEvent.create({
        data: {
          orgId,
          service,
          operation,
          credits,
          idempotencyKey,
        },
      });

      // Update the credit balance
      const updated = await tx.creditBalance.update({
        where: { orgId },
        data: {
          creditsUsed: { increment: addToUsed },
          overageCredits: { increment: addToOverage },
        },
      });

      const newRemaining = Math.max(0, updated.creditsIncluded - updated.creditsUsed);

      return {
        recorded: true,
        creditsRemaining: newRemaining,
        overageCredits: updated.overageCredits,
      };
    });

    if (result.recorded) {
      this.logger.log(
        `Recorded ${credits} credits for org=${orgId} service=${service} op=${operation} ` +
          `remaining=${result.creditsRemaining} overage=${result.overageCredits}`
      );
    }

    return { ...result, tier };
  }

  /**
   * Get the credit balance for an org.
   *
   * Returns the full balance details including overage rate for the
   * org's current subscription tier.
   */
  async getBalance(orgId: string): Promise<{
    creditsIncluded: number;
    creditsUsed: number;
    creditsRemaining: number;
    overageCredits: number;
    overageRate: number | null;
    tier: string;
    periodStart: Date;
    periodEnd: Date;
  }> {
    const balance = await this.getOrCreateBalance(orgId);
    const tier = await this.getOrgTier(orgId);

    return {
      creditsIncluded: balance.creditsIncluded,
      creditsUsed: balance.creditsUsed,
      creditsRemaining: Math.max(0, balance.creditsIncluded - balance.creditsUsed),
      overageCredits: balance.overageCredits,
      overageRate: OVERAGE_RATES[tier] ?? null,
      tier,
      periodStart: balance.periodStart,
      periodEnd: balance.periodEnd,
    };
  }

  /**
   * Get aggregated usage events for an org with optional filtering.
   *
   * Returns per-service and per-operation breakdowns within the
   * specified date range.
   */
  async getUsage(
    orgId: string,
    startDate?: Date,
    endDate?: Date,
    service?: string
  ): Promise<{
    totalCredits: number;
    events: Array<{
      service: string;
      operation: string;
      credits: number;
      createdAt: Date;
    }>;
    breakdown: Record<string, { totalCredits: number; operations: Record<string, number> }>;
  }> {
    const where: Record<string, unknown> = { orgId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = startDate;
      if (endDate) (where.createdAt as Record<string, unknown>).lte = endDate;
    }
    if (service) {
      where.service = service;
    }

    const events = await this.prisma.usageEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        service: true,
        operation: true,
        credits: true,
        createdAt: true,
      },
    });

    // Build breakdown by service and operation
    const breakdown: Record<string, { totalCredits: number; operations: Record<string, number> }> =
      {};
    let totalCredits = 0;

    for (const event of events) {
      totalCredits += event.credits;
      if (!breakdown[event.service]) {
        breakdown[event.service] = { totalCredits: 0, operations: {} };
      }
      breakdown[event.service].totalCredits += event.credits;
      breakdown[event.service].operations[event.operation] =
        (breakdown[event.service].operations[event.operation] ?? 0) + event.credits;
    }

    return { totalCredits, events, breakdown };
  }

  /**
   * Reset the credit balance for a new billing period.
   *
   * Called by the billing cycle webhook when a subscription renews.
   * Resets creditsUsed and overageCredits to 0 and advances the period dates.
   */
  async resetPeriod(orgId: string): Promise<void> {
    const balance = await this.prisma.creditBalance.findUnique({ where: { orgId } });
    if (!balance) {
      this.logger.warn(`No credit balance found for org ${orgId} during period reset`);
      return;
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await this.prisma.creditBalance.update({
      where: { orgId },
      data: {
        creditsUsed: 0,
        overageCredits: 0,
        periodStart: now,
        periodEnd,
      },
    });

    this.logger.log(
      `Reset credit period for org=${orgId}: ` +
        `included=${balance.creditsIncluded} periodEnd=${periodEnd.toISOString()}`
    );
  }

  /**
   * Provision or update credit allowance when a subscription changes tier.
   *
   * Called when a subscription is created, upgraded, or downgraded.
   * Updates the creditsIncluded value based on the new tier mapping.
   */
  async provisionCredits(orgId: string, tier: string): Promise<void> {
    const creditsIncluded = TIER_CREDITS[tier] ?? TIER_CREDITS.community;

    const existing = await this.prisma.creditBalance.findUnique({ where: { orgId } });

    if (existing) {
      await this.prisma.creditBalance.update({
        where: { orgId },
        data: { creditsIncluded },
      });
      this.logger.log(
        `Updated credit provision for org=${orgId}: tier=${tier} credits=${creditsIncluded}`
      );
    } else {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await this.prisma.creditBalance.create({
        data: {
          orgId,
          creditsIncluded,
          creditsUsed: 0,
          overageCredits: 0,
          periodStart: now,
          periodEnd,
        },
      });
      this.logger.log(
        `Provisioned credits for org=${orgId}: tier=${tier} credits=${creditsIncluded}`
      );
    }
  }

  // ─── Internal helpers ─────────────────────────────────────────────────

  /**
   * Get or lazily create a credit balance for an org.
   */
  private async getOrCreateBalance(orgId: string) {
    const balance = await this.prisma.creditBalance.findUnique({ where: { orgId } });
    if (balance) return balance;

    const tier = await this.getOrgTier(orgId);
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    return this.prisma.creditBalance.create({
      data: {
        orgId,
        creditsIncluded: TIER_CREDITS[tier] ?? TIER_CREDITS.community,
        creditsUsed: 0,
        overageCredits: 0,
        periodStart: now,
        periodEnd,
      },
    });
  }

  /**
   * Resolve the subscription tier for an org.
   *
   * Looks up the user associated with the orgId to determine their
   * subscription tier. Falls back to 'community' if not found.
   *
   * In practice, orgId maps to a Janua user ID since Dhanam's billing
   * is user-scoped. If the org model evolves, this lookup can be
   * adjusted without changing the public API.
   */
  private async getOrgTier(orgId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: orgId },
      select: { subscriptionTier: true },
    });

    return user?.subscriptionTier ?? 'community';
  }
}
