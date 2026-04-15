import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { StripeService } from '../stripe.service';

const OVERAGE_RATES: Record<string, number | null> = {
  community: null,
  essentials: 0.002,
  pro: 0.0015,
  premium: 0.001,
};

@Injectable()
export class OverageInvoicingJob {
  private readonly logger = new Logger(OverageInvoicingJob.name);

  constructor(
    private prisma: PrismaService,
    private stripe: StripeService
  ) {}

  @Cron('0 4 * * *', { name: 'overage-invoicing' })
  async invoiceOverages(): Promise<void> {
    this.logger.log('Starting overage invoicing run...');

    const balancesWithOverage = await this.prisma.creditBalance.findMany({
      where: { overageCredits: { gt: 0 } },
    });

    let invoiced = 0;
    let skipped = 0;

    for (const balance of balancesWithOverage) {
      try {
        // Look up user by orgId (which maps to userId in CreditBalance)
        const user = await this.prisma.user.findUnique({
          where: { id: balance.orgId },
          select: {
            id: true,
            stripeCustomerId: true,
            subscriptionTier: true,
          },
        });

        if (!user?.stripeCustomerId) {
          this.logger.debug(`Skipping overage for org=${balance.orgId}: no Stripe customer`);
          skipped++;
          continue;
        }

        const rate = OVERAGE_RATES[user.subscriptionTier || 'community'];
        if (rate === null || rate === undefined) {
          // Community tier — should have been blocked by usage-metering, but skip just in case
          skipped++;
          continue;
        }

        const amount = balance.overageCredits * rate; // USD
        if (amount < 0.5) {
          // Stripe minimum charge is $0.50 — accumulate until next cycle
          this.logger.debug(
            `Skipping overage for user=${user.id}: amount $${amount.toFixed(2)} below minimum`
          );
          skipped++;
          continue;
        }

        // Create Stripe invoice item
        await this.stripe.createInvoiceItem({
          customerId: user.stripeCustomerId,
          amount,
          currency: 'usd',
          description: `Credit overage: ${balance.overageCredits} credits at $${rate}/credit`,
        });

        // Create and finalize the invoice
        await this.stripe.createInvoice(user.stripeCustomerId);

        // Reset overage (atomic to prevent double-billing)
        await this.prisma.creditBalance.update({
          where: { id: balance.id },
          data: { overageCredits: 0 },
        });

        // Record billing event
        await this.prisma.billingEvent.create({
          data: {
            userId: user.id,
            type: 'payment_succeeded',
            amount: parseFloat(amount.toFixed(2)),
            currency: 'USD',
            status: 'succeeded',
            metadata: {
              type: 'overage_invoice',
              credits: balance.overageCredits,
              rate,
            },
          },
        });

        invoiced++;
        this.logger.log(
          `Overage invoiced: user=${user.id} credits=${balance.overageCredits} amount=$${amount.toFixed(2)}`
        );
      } catch (err) {
        this.logger.error(
          `Overage invoicing failed for org=${balance.orgId}: ${(err as Error).message}`
        );
      }
    }

    this.logger.log(`Overage invoicing complete: ${invoiced} invoiced, ${skipped} skipped`);
  }
}
