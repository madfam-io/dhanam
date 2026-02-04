import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from '@db';
import { Job } from 'bullmq';

import { PrismaService } from '@core/prisma/prisma.service';

import { ValuationSnapshotJobData } from '../queue.service';

@Injectable()
export class ValuationSnapshotProcessor {
  private readonly logger = new Logger(ValuationSnapshotProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  async process(job: Job<ValuationSnapshotJobData['payload']>): Promise<any> {
    const { spaceId, date } = job.data;
    const snapshotDate = date ? new Date(date) : new Date();

    this.logger.log(
      `Processing valuation snapshot for space ${spaceId} on ${snapshotDate.toISOString()}`
    );

    try {
      // Get all accounts for the space
      const accounts = await this.prisma.account.findMany({
        where: { spaceId },
        include: {
          space: {
            select: { currency: true },
          },
        },
      });

      if (accounts.length === 0) {
        this.logger.warn(`No accounts found for space ${spaceId}`);
        return { accounts: 0, snapshots: 0 };
      }

      let snapshotsCreated = 0;

      // Create valuation snapshot for each account
      for (const account of accounts) {
        try {
          // Check if snapshot already exists for this date
          const existingSnapshot = await this.prisma.assetValuation.findFirst({
            where: {
              accountId: account.id,
              date: {
                gte: new Date(
                  snapshotDate.getFullYear(),
                  snapshotDate.getMonth(),
                  snapshotDate.getDate()
                ),
                lt: new Date(
                  snapshotDate.getFullYear(),
                  snapshotDate.getMonth(),
                  snapshotDate.getDate() + 1
                ),
              },
            },
          });

          if (existingSnapshot) {
            // Update existing snapshot
            await this.prisma.assetValuation.update({
              where: { id: existingSnapshot.id },
              data: {
                value: account.balance,
                currency: account.currency,
              },
            });
          } else {
            // Create new snapshot
            await this.prisma.assetValuation.create({
              data: {
                accountId: account.id,
                date: snapshotDate,
                value: account.balance,
                currency: account.currency,
              },
            });
            snapshotsCreated++;
          }
        } catch (error) {
          this.logger.error(
            `Failed to create snapshot for account ${account.id}: ${(error as Error).message}`
          );
        }
      }

      // Calculate net worth for the space
      const totalAssets = accounts
        .filter((account) => ['checking', 'savings', 'investment', 'crypto'].includes(account.type))
        .reduce((sum, account) => {
          const balance =
            account.balance instanceof Decimal
              ? account.balance.toNumber()
              : Number(account.balance);
          return sum + balance;
        }, 0);

      const totalLiabilities = accounts
        .filter((account) => account.type === 'credit')
        .reduce((sum, account) => {
          const balance =
            account.balance instanceof Decimal
              ? account.balance.toNumber()
              : Number(account.balance);
          return sum + Math.abs(balance);
        }, 0);

      const netWorth = totalAssets - totalLiabilities;

      this.logger.log(
        `Valuation snapshot completed for space ${spaceId}: ${snapshotsCreated} snapshots created, net worth: $${netWorth.toFixed(2)}`
      );

      return {
        accounts: accounts.length,
        snapshots: snapshotsCreated,
        netWorth,
        totalAssets,
        totalLiabilities,
      };
    } catch (error) {
      this.logger.error(
        `Valuation snapshot failed for space ${spaceId}: ${(error as Error).message}`
      );
      throw error;
    }
  }
}
