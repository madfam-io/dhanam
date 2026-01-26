import * as crypto from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import { AccountsGetRequest } from 'plaid';

import { CryptoService } from '@core/crypto/crypto.service';
import { PrismaService } from '@core/prisma/prisma.service';

import { PlaidWebhookDto } from './dto';

/**
 * Handles Plaid webhook processing for transaction, account, and item events.
 * Separated from PlaidService for better maintainability and separation of concerns.
 */
@Injectable()
export class PlaidWebhookHandler {
  private readonly logger = new Logger(PlaidWebhookHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService
  ) {}

  /**
   * Verify webhook signature using HMAC-SHA256
   */
  verifySignature(payload: string, signature: string, webhookSecret: string): boolean {
    if (!webhookSecret || !signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Handle transaction-related webhooks
   */
  async handleTransactionWebhook(
    webhook: PlaidWebhookDto,
    syncTransactions: (accessToken: string, itemId: string) => Promise<any>,
    removeTransaction: (transactionId: string, itemId: string) => Promise<void>
  ): Promise<void> {
    const { item_id, webhook_code } = webhook;

    const connection = await this.prisma.providerConnection.findFirst({
      where: {
        provider: 'plaid',
        providerUserId: item_id,
      },
    });

    if (!connection) {
      this.logger.warn(`No connection found for Plaid item ${item_id}`);
      return;
    }

    const accessToken = this.cryptoService.decrypt(JSON.parse(connection.encryptedToken));

    switch (webhook_code) {
      case 'SYNC_UPDATES_AVAILABLE':
      case 'DEFAULT_UPDATE':
      case 'INITIAL_UPDATE':
      case 'HISTORICAL_UPDATE':
        await syncTransactions(accessToken, item_id);
        break;
      case 'TRANSACTIONS_REMOVED':
        if (webhook.removed_transactions) {
          for (const removedId of webhook.removed_transactions) {
            await removeTransaction(removedId, item_id);
          }
        }
        break;
    }
  }

  /**
   * Handle account-related webhooks
   */
  async handleAccountWebhook(
    webhook: PlaidWebhookDto,
    callPlaidApi: <T>(operation: string, apiCall: () => Promise<T>) => Promise<T>,
    plaidClient: any
  ): Promise<void> {
    this.logger.log(`Account webhook received for item ${webhook.item_id}`);

    const connection = await this.prisma.providerConnection.findFirst({
      where: {
        provider: 'plaid',
        providerUserId: webhook.item_id,
      },
    });

    if (!connection) {
      this.logger.warn(`No connection found for Plaid item ${webhook.item_id}`);
      return;
    }

    const accessToken = this.cryptoService.decrypt(JSON.parse(connection.encryptedToken));

    const request: AccountsGetRequest = {
      access_token: accessToken,
    };

    const response = await callPlaidApi('accountsGet', () => plaidClient.accountsGet(request));

    for (const plaidAccount of response.data.accounts) {
      await this.prisma.account.updateMany({
        where: {
          provider: 'plaid',
          providerAccountId: plaidAccount.account_id,
        },
        data: {
          balance: plaidAccount.balances.current || 0,
          lastSyncedAt: new Date(),
          metadata: {
            mask: plaidAccount.mask,
            officialName: plaidAccount.official_name,
            itemId: webhook.item_id,
            balances: {
              available: plaidAccount.balances.available,
              current: plaidAccount.balances.current,
              limit: plaidAccount.balances.limit,
              iso_currency_code: plaidAccount.balances.iso_currency_code,
              unofficial_currency_code: plaidAccount.balances.unofficial_currency_code,
            },
          } as InputJsonValue,
        },
      });
    }

    this.logger.log(`Updated accounts for Plaid item ${webhook.item_id}`);
  }

  /**
   * Handle item-related webhooks (errors, expiration, permission revocation)
   */
  async handleItemWebhook(webhook: PlaidWebhookDto): Promise<void> {
    const { item_id, webhook_code, error } = webhook;

    switch (webhook_code) {
      case 'ERROR':
        this.logger.error(`Plaid item error for ${item_id}:`, error);
        await this.markConnectionErrored(item_id, error);
        break;

      case 'PENDING_EXPIRATION':
        this.logger.warn(`Plaid item ${item_id} will expire soon`);
        await this.markConnectionExpiring(item_id);
        break;

      case 'USER_PERMISSION_REVOKED':
        this.logger.log(`User revoked permissions for Plaid item ${item_id}`);
        await this.markConnectionRevoked(item_id);
        break;
    }
  }

  private async markConnectionErrored(itemId: string, error: any): Promise<void> {
    await this.prisma.providerConnection.updateMany({
      where: { provider: 'plaid', providerUserId: itemId },
      data: {
        metadata: {
          error: error || 'Unknown error',
          erroredAt: new Date().toISOString(),
        },
      },
    });
    this.logger.log(`Marked connection for Plaid item ${itemId} as errored`);
  }

  private async markConnectionExpiring(itemId: string): Promise<void> {
    await this.prisma.providerConnection.updateMany({
      where: { provider: 'plaid', providerUserId: itemId },
      data: {
        metadata: {
          pendingExpiration: true,
          expirationWarningAt: new Date().toISOString(),
        },
      },
    });
  }

  private async markConnectionRevoked(itemId: string): Promise<void> {
    await this.prisma.providerConnection.updateMany({
      where: { provider: 'plaid', providerUserId: itemId },
      data: {
        metadata: { revokedAt: new Date().toISOString() },
      },
    });
    this.logger.log(`Marked connection for Plaid item ${itemId} as revoked`);
  }
}
