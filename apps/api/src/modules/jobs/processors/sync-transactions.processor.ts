import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@core/prisma/prisma.service';
import { BelvoService } from '@modules/providers/belvo/belvo.service';
import { PlaidService } from '@modules/providers/plaid/plaid.service';
import { BitsoService } from '@modules/providers/bitso/bitso.service';
import { CryptoService } from '@core/crypto/crypto.service';
import { SyncTransactionsJobData } from '../queue.service';

@Injectable()
export class SyncTransactionsProcessor {
  private readonly logger = new Logger(SyncTransactionsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly belvoService: BelvoService,
    private readonly plaidService: PlaidService,
    private readonly bitsoService: BitsoService,
    private readonly cryptoService: CryptoService,
  ) {}

  async process(job: Job<SyncTransactionsJobData['payload']>): Promise<any> {
    const { provider, userId, connectionId, fullSync } = job.data;
    
    this.logger.log(
      `Processing sync job for provider ${provider}, user ${userId}, connection ${connectionId}`
    );

    try {
      const connection = await this.prisma.providerConnection.findUnique({
        where: { id: connectionId },
        include: { user: true },
      });

      if (!connection) {
        throw new Error(`Connection ${connectionId} not found`);
      }

      if (connection.userId !== userId) {
        throw new Error(`Connection ${connectionId} does not belong to user ${userId}`);
      }

      let result;

      switch (provider) {
        case 'belvo':
          result = await this.syncBelvoTransactions(connection, fullSync);
          break;
        case 'plaid':
          result = await this.syncPlaidTransactions(connection, fullSync);
          break;
        case 'bitso':
          result = await this.syncBitsoTransactions(connection, fullSync);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      // Update connection metadata
      await this.prisma.providerConnection.update({
        where: { id: connectionId },
        data: {
          metadata: {
            ...(connection.metadata as any),
            lastSyncAt: new Date().toISOString(),
            lastSyncResult: result,
          },
        },
      });

      this.logger.log(
        `Sync completed for ${provider} connection ${connectionId}: ${result.transactions} transactions processed`
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Sync failed for ${provider} connection ${connectionId}: ${(error as Error).message}`
      );
      throw error;
    }
  }

  private async syncBelvoTransactions(connection: any, fullSync = false) {
    // Decrypt token
    const accessToken = this.cryptoService.decrypt(JSON.parse(connection.encryptedToken));
    
    // Get sync cursor from metadata
    const metadata = connection.metadata as any;
    const cursor = fullSync ? undefined : metadata?.syncCursor;
    
    // Perform sync (this would call actual Belvo service methods)
    const result = await this.belvoService.syncTransactions(
      accessToken,
      connection.providerUserId,
      cursor
    );

    return {
      provider: 'belvo',
      transactions: Array.isArray(result) ? result.length : 0,
      accounts: 1,
      cursor: undefined,
    };
  }

  private async syncPlaidTransactions(connection: any, _fullSync = false) {
    // Decrypt token
    const accessToken = this.cryptoService.decrypt(JSON.parse(connection.encryptedToken));
    
    // Use Plaid transactions sync
    const result = await this.plaidService.syncTransactions(
      accessToken,
      connection.providerUserId
    );

    return {
      provider: 'plaid',
      transactions: result?.transactionCount || 0,
      accounts: result?.accountCount || 0,
    };
  }

  private async syncBitsoTransactions(connection: any, _fullSync = false) {
    // Sync crypto portfolio
    await this.bitsoService.syncPortfolio(connection.userId);

    return {
      provider: 'bitso',
      transactions: 'portfolio_sync',
      accounts: 1,
    };
  }
}