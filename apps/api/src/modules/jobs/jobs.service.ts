import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '@core/prisma/prisma.service';
import { RulesService } from '@modules/categories/rules.service';
import { BitsoService } from '@modules/providers/bitso/bitso.service';
import { BlockchainService } from '@modules/providers/blockchain/blockchain.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private prisma: PrismaService,
    private rulesService: RulesService,
    private bitsoService: BitsoService,
    private blockchainService: BlockchainService
  ) {}

  // Run every hour - categorize new transactions
  @Cron(CronExpression.EVERY_HOUR)
  async categorizeNewTransactions(): Promise<void> {
    this.logger.log('Starting automatic transaction categorization');

    try {
      const spaces = await this.prisma.space.findMany({
        select: { id: true },
      });

      let totalCategorized = 0;
      let totalProcessed = 0;

      for (const space of spaces) {
        const result = await this.rulesService.batchCategorizeTransactions(space.id);
        totalCategorized += result.categorized;
        totalProcessed += result.total;
      }

      this.logger.log(
        `Auto-categorization complete: ${totalCategorized}/${totalProcessed} transactions categorized across ${spaces.length} spaces`
      );
    } catch (error) {
      this.logger.error('Failed to auto-categorize transactions:', error);
    }
  }

  // Run every 4 hours - sync crypto portfolios
  @Cron('0 */4 * * *')
  async syncCryptoPortfolios(): Promise<void> {
    this.logger.log('Starting scheduled crypto portfolio sync');

    try {
      const connections = await this.prisma.providerConnection.findMany({
        where: {
          provider: 'bitso',
        },
        select: { userId: true },
        distinct: ['userId'],
      });

      for (const connection of connections) {
        try {
          await this.bitsoService.syncPortfolio(connection.userId);
          this.logger.log(`Synced crypto portfolio for user ${connection.userId}`);
        } catch (error) {
          this.logger.error(`Failed to sync crypto for user ${connection.userId}:`, error);
        }
      }

      this.logger.log(`Crypto sync complete for ${connections.length} users`);
    } catch (error) {
      this.logger.error('Failed to sync crypto portfolios:', error);
    }
  }

  // Run every 6 hours - sync blockchain wallets (ETH, BTC)
  @Cron('0 */6 * * *')
  async syncBlockchainWallets(): Promise<void> {
    this.logger.log('Starting scheduled blockchain wallet sync');

    try {
      const accounts = await this.prisma.account.findMany({
        where: {
          provider: 'manual',
          metadata: {
            path: ['readOnly'],
            equals: true,
          },
        },
        include: {
          space: {
            include: {
              userSpaces: {
                select: { userId: true },
                take: 1,
              },
            },
          },
        },
        distinct: ['spaceId'],
      });

      const uniqueUserIds = new Set(
        accounts
          .map((account) => account.space.userSpaces[0]?.userId)
          .filter((userId): userId is string => !!userId)
      );

      for (const userId of uniqueUserIds) {
        try {
          await this.blockchainService.syncWallets(userId);
          this.logger.log(`Synced blockchain wallets for user ${userId}`);
        } catch (error) {
          this.logger.error(`Failed to sync blockchain wallets for user ${userId}:`, error);
        }
      }

      this.logger.log(`Blockchain wallet sync complete for ${uniqueUserIds.size} users`);
    } catch (error) {
      this.logger.error('Failed to sync blockchain wallets:', error);
    }
  }

  // Run daily at 2 AM - cleanup expired sessions
  @Cron('0 2 * * *')
  async cleanupExpiredSessions(): Promise<void> {
    this.logger.log('Starting session cleanup');

    try {
      // This would be handled by Redis TTL, but we can log metrics
      const activeConnections = await this.prisma.providerConnection.count();
      const oldConnections = await this.prisma.providerConnection.count({
        where: {
          updatedAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          },
        },
      });

      this.logger.log(
        `Session cleanup complete. Active connections: ${activeConnections}, Stale connections: ${oldConnections}`
      );
    } catch (error) {
      this.logger.error('Failed to cleanup sessions:', error);
    }
  }

  // Run daily at 3 AM - generate daily valuation snapshots
  @Cron('0 3 * * *')
  async generateValuationSnapshots(): Promise<void> {
    this.logger.log('Starting daily valuation snapshot generation');

    try {
      const spaces = await this.prisma.space.findMany({
        include: {
          accounts: true,
        },
      });

      for (const space of spaces) {
        // Calculate total assets and liabilities
        const totalAssets = space.accounts
          .filter((account: any) =>
            ['checking', 'savings', 'investment', 'crypto'].includes(account.type)
          )
          .reduce((sum: number, account: any) => sum + account.balance.toNumber(), 0);

        const totalLiabilities = space.accounts
          .filter((account: any) => account.type === 'credit')
          .reduce((sum: number, account: any) => sum + Math.abs(account.balance.toNumber()), 0);

        const netWorth = totalAssets - totalLiabilities;

        // Create asset valuation snapshot for each account
        for (const account of space.accounts) {
          await this.prisma.assetValuation.create({
            data: {
              accountId: account.id,
              date: new Date(),
              value: account.balance,
              currency: account.currency,
            },
          });
        }

        this.logger.log(
          `Created valuation snapshot for space ${space.id}: $${netWorth.toFixed(2)}`
        );
      }

      this.logger.log(`Daily snapshots created for ${spaces.length} spaces`);
    } catch (error) {
      this.logger.error('Failed to generate valuation snapshots:', error);
    }
  }

  // Manual trigger for immediate categorization
  async triggerCategorization(spaceId?: string): Promise<{
    categorized: number;
    total: number;
    spaces: number;
  }> {
    this.logger.log(`Manual categorization triggered for ${spaceId || 'all spaces'}`);

    const spaces = spaceId
      ? [{ id: spaceId }]
      : await this.prisma.space.findMany({ select: { id: true } });

    let totalCategorized = 0;
    let totalProcessed = 0;

    for (const space of spaces) {
      const result = await this.rulesService.batchCategorizeTransactions(space.id);
      totalCategorized += result.categorized;
      totalProcessed += result.total;
    }

    return {
      categorized: totalCategorized,
      total: totalProcessed,
      spaces: spaces.length,
    };
  }

  // Manual trigger for portfolio sync
  async triggerPortfolioSync(userId?: string): Promise<{
    syncedUsers: number;
    errors: number;
  }> {
    this.logger.log(`Manual portfolio sync triggered for ${userId || 'all users'}`);

    const connections = userId
      ? await this.prisma.providerConnection.findMany({
          where: { userId, provider: 'bitso' },
          select: { userId: true },
          distinct: ['userId'],
        })
      : await this.prisma.providerConnection.findMany({
          where: { provider: 'bitso' },
          select: { userId: true },
          distinct: ['userId'],
        });

    let syncedUsers = 0;
    let errors = 0;

    for (const connection of connections) {
      try {
        await this.bitsoService.syncPortfolio(connection.userId);
        syncedUsers++;
      } catch (error) {
        this.logger.error(`Failed to sync portfolio for user ${connection.userId}:`, error);
        errors++;
      }
    }

    return { syncedUsers, errors };
  }
}
