import * as crypto from 'crypto';

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Account, Currency, AccountType } from '@prisma/client';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import {
  PlaidApi,
  Configuration,
  PlaidEnvironments,
  CountryCode,
  Products,
  ItemPublicTokenExchangeRequest,
  LinkTokenCreateRequest,
  AccountsGetRequest,
  TransactionsSyncRequest,
  DepositoryAccountSubtype,
  CreditAccountSubtype,
} from 'plaid';

import { MonitorPerformance } from '@core/decorators/monitor-performance.decorator';

import { CryptoService } from '../../../core/crypto/crypto.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { PlaidAccountMetadata } from '../../../types/metadata.types';
import { isUniqueConstraintError } from '../../../types/prisma-errors.types';

import { CreatePlaidLinkDto, PlaidWebhookDto } from './dto';

@Injectable()
export class PlaidService {
  private readonly logger = new Logger(PlaidService.name);
  private plaidClient: PlaidApi | null = null;
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService
  ) {
    this.initializePlaidClient();
    this.webhookSecret = this.configService.get('PLAID_WEBHOOK_SECRET', '');
  }

  private initializePlaidClient() {
    const clientId = this.configService.get('PLAID_CLIENT_ID');
    const secret = this.configService.get('PLAID_SECRET');
    const env = this.configService.get('PLAID_ENV', 'sandbox');

    if (!clientId || !secret) {
      this.logger.warn('Plaid credentials not configured, service disabled');
      return;
    }

    const configuration = new Configuration({
      basePath: PlaidEnvironments[env],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': clientId,
          'PLAID-SECRET': secret,
        },
      },
    });

    this.plaidClient = new PlaidApi(configuration);
    this.logger.log('Plaid client initialized successfully');
  }

  async createLinkToken(userId: string): Promise<{ linkToken: string; expiration: Date }> {
    if (!this.plaidClient) {
      throw new BadRequestException('Plaid integration not configured');
    }

    try {
      const request: LinkTokenCreateRequest = {
        products: [Products.Transactions, Products.Auth],
        client_name: 'Dhanam Ledger',
        country_codes: [CountryCode.Us],
        language: 'en',
        user: {
          client_user_id: userId,
        },
        webhook: this.configService.get('PLAID_WEBHOOK_URL'),
        account_filters: {
          depository: {
            account_subtypes: [DepositoryAccountSubtype.Checking, DepositoryAccountSubtype.Savings],
          },
          credit: {
            account_subtypes: [CreditAccountSubtype.CreditCard],
          },
        },
      };

      const response = await this.plaidClient.linkTokenCreate(request);
      const { link_token, expiration } = response.data;

      return {
        linkToken: link_token,
        expiration: new Date(expiration),
      };
    } catch (error) {
      this.logger.error('Failed to create Plaid Link token:', error);
      throw new BadRequestException('Failed to create Link token');
    }
  }

  /**
   * Fetch and sync accounts for a specific Plaid connection
   * @param connectionId - The provider connection ID
   * @returns Array of synced accounts
   */
  async fetchAccounts(connectionId: string): Promise<Account[]> {
    const connection = await this.prisma.providerConnection.findUnique({
      where: { id: connectionId },
      include: { user: { include: { spaces: { take: 1 } } as any } as any },
    });

    if (!connection || connection.provider !== 'plaid') {
      throw new BadRequestException('Invalid Plaid connection');
    }

    const accessToken = this.cryptoService.decrypt(JSON.parse(connection.encryptedToken));
    const itemId = connection.providerUserId;
    const spaceId = (connection.user as any).spaces[0]?.id;

    if (!spaceId) {
      throw new BadRequestException('No space found for user');
    }

    return this.syncAccounts(spaceId, accessToken, itemId);
  }

  /**
   * Fetch transactions for a specific account within a date range
   * @param accountId - The account ID
   * @param startDate - Start date for transaction fetch
   * @param endDate - End date for transaction fetch (defaults to today)
   * @returns Transaction sync result
   */
  async fetchTransactionsByDateRange(
    accountId: string,
    startDate: Date,
    _endDate: Date = new Date()
  ): Promise<{ transactionCount: number; accountCount: number }> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        space: {
          include: { user: { include: { providerConnections: true } } as any } as any,
        } as any,
      },
    });

    if (!account || account.provider !== 'plaid') {
      throw new BadRequestException('Invalid Plaid account');
    }

    const metadata = account.metadata as unknown as PlaidAccountMetadata;
    const itemId = metadata?.itemId;
    if (!itemId) {
      throw new BadRequestException('Account missing Plaid item ID');
    }

    const connection = (account as any).space.user.providerConnections.find(
      (conn) => conn.provider === 'plaid' && conn.providerUserId === itemId
    );

    if (!connection) {
      throw new BadRequestException('Plaid connection not found');
    }

    const accessToken = this.cryptoService.decrypt(JSON.parse(connection.encryptedToken));

    return this.syncTransactions(accessToken, itemId);
  }

  async createLink(
    spaceId: string,
    userId: string,
    dto: CreatePlaidLinkDto
  ): Promise<{ accounts: Account[] }> {
    if (!this.plaidClient) {
      throw new BadRequestException('Plaid integration not configured');
    }

    try {
      // Exchange public token for access token
      const exchangeRequest: ItemPublicTokenExchangeRequest = {
        public_token: dto.publicToken,
      };

      const exchangeResponse = await this.plaidClient.itemPublicTokenExchange(exchangeRequest);
      const { access_token, item_id } = exchangeResponse.data;

      // Store encrypted access token
      const encryptedToken = this.cryptoService.encrypt(access_token);
      await this.prisma.providerConnection.create({
        data: {
          provider: 'plaid',
          providerUserId: item_id,
          encryptedToken: JSON.stringify(encryptedToken),
          metadata: {
            publicToken: dto.publicToken,
            itemId: item_id,
            externalId: dto.externalId,
            connectedAt: new Date().toISOString(),
          } as InputJsonValue,
          user: { connect: { id: userId } },
        },
      });

      // Fetch and sync accounts
      const accounts = await this.syncAccounts(spaceId, access_token, item_id);

      // Initial transaction sync
      await this.syncTransactions(access_token, item_id);

      this.logger.log(`Successfully linked Plaid item ${item_id} for user ${userId}`);
      return { accounts };
    } catch (error) {
      this.logger.error('Failed to create Plaid link:', error);
      throw new BadRequestException('Failed to link Plaid account');
    }
  }

  private async syncAccounts(
    spaceId: string,
    accessToken: string,
    itemId: string
  ): Promise<Account[]> {
    const request: AccountsGetRequest = {
      access_token: accessToken,
    };

    const response = await this.plaidClient!.accountsGet(request);
    const plaidAccounts = response.data.accounts;

    const accounts: Account[] = [];

    for (const plaidAccount of plaidAccounts) {
      const accountData = {
        spaceId,
        provider: 'plaid' as const,
        providerAccountId: plaidAccount.account_id,
        name: plaidAccount.name,
        type: this.mapAccountType(plaidAccount.type),
        subtype: plaidAccount.subtype || plaidAccount.type,
        currency: this.mapCurrency(plaidAccount.balances.iso_currency_code || 'USD'),
        balance: plaidAccount.balances.current || 0,
        lastSyncedAt: new Date(),
        metadata: {
          mask: plaidAccount.mask,
          officialName: plaidAccount.official_name,
          itemId,
          balances: {
            available: plaidAccount.balances.available,
            current: plaidAccount.balances.current,
            limit: plaidAccount.balances.limit,
            iso_currency_code: plaidAccount.balances.iso_currency_code,
            unofficial_currency_code: plaidAccount.balances.unofficial_currency_code,
          },
        } as InputJsonValue,
      };

      const account = await this.prisma.account.create({ data: accountData });
      accounts.push(account);
    }

    return accounts;
  }

  @MonitorPerformance(2000) // 2 second threshold for transaction sync
  async syncTransactions(
    accessToken: string,
    itemId: string
  ): Promise<{ transactionCount: number; accountCount: number; nextCursor?: string }> {
    try {
      // Use transactions sync for better performance
      const request: TransactionsSyncRequest = {
        access_token: accessToken,
      };

      const response = await this.plaidClient!.transactionsSync(request);
      const { added, modified, removed, next_cursor } = response.data;

      // Process added transactions
      for (const plaidTransaction of added) {
        await this.createTransactionFromPlaid(plaidTransaction, itemId);
      }

      // Process modified transactions
      for (const plaidTransaction of modified) {
        await this.updateTransactionFromPlaid(plaidTransaction, itemId);
      }

      // Process removed transactions
      for (const removedId of removed) {
        await this.removeTransaction(removedId.transaction_id, itemId);
      }

      // Store cursor for next sync
      if (next_cursor) {
        await this.prisma.providerConnection.updateMany({
          where: {
            provider: 'plaid',
            providerUserId: itemId,
          },
          data: {
            metadata: {
              cursor: next_cursor,
              lastSyncAt: new Date().toISOString(),
            },
          },
        });
      }

      this.logger.log(
        `Synced transactions for item ${itemId}: ${added.length} added, ${modified.length} modified, ${removed.length} removed`
      );

      return {
        transactionCount: added.length + modified.length,
        accountCount: 1, // Will be determined by account sync
        nextCursor: next_cursor,
      };
    } catch (error) {
      this.logger.error(`Failed to sync transactions for item ${itemId}:`, error);
      throw error;
    }
  }

  private async createTransactionFromPlaid(plaidTransaction: any, _itemId: string) {
    try {
      // Find the account
      const account = await this.prisma.account.findFirst({
        where: {
          provider: 'plaid',
          providerAccountId: plaidTransaction.account_id,
        },
      });

      if (!account) {
        this.logger.warn(`Account not found for transaction ${plaidTransaction.transaction_id}`);
        return;
      }

      // Create transaction
      await this.prisma.transaction.create({
        data: {
          accountId: account.id,
          providerTransactionId: plaidTransaction.transaction_id,
          amount: -plaidTransaction.amount, // Plaid uses positive for outflows
          currency: account.currency as Currency,
          date: new Date(plaidTransaction.date),
          description: plaidTransaction.name,
          merchant: plaidTransaction.merchant_name,
          metadata: {
            plaidCategory: plaidTransaction.category,
            plaidCategoryId: plaidTransaction.category_id,
            accountOwner: plaidTransaction.account_owner,
            authorizedDate: plaidTransaction.authorized_date,
            location: plaidTransaction.location,
            paymentMeta: plaidTransaction.payment_meta,
          } as InputJsonValue,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        // Transaction already exists, skip
        return;
      }
      this.logger.error(`Failed to create transaction ${plaidTransaction.transaction_id}:`, error);
    }
  }

  private async updateTransactionFromPlaid(plaidTransaction: any, _itemId: string) {
    try {
      await this.prisma.transaction.updateMany({
        where: {
          providerTransactionId: plaidTransaction.transaction_id,
        },
        data: {
          amount: -plaidTransaction.amount,
          date: new Date(plaidTransaction.date),
          description: plaidTransaction.name,
          merchant: plaidTransaction.merchant_name,
          metadata: {
            plaidCategory: plaidTransaction.category,
            plaidCategoryId: plaidTransaction.category_id,
            accountOwner: plaidTransaction.account_owner,
            authorizedDate: plaidTransaction.authorized_date,
            location: plaidTransaction.location,
            paymentMeta: plaidTransaction.payment_meta,
          } as InputJsonValue,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update transaction ${plaidTransaction.transaction_id}:`, error);
    }
  }

  private async removeTransaction(transactionId: string, _itemId: string) {
    try {
      await this.prisma.transaction.deleteMany({
        where: {
          providerTransactionId: transactionId,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to remove transaction ${transactionId}:`, error);
    }
  }

  async handleWebhook(webhookData: PlaidWebhookDto, signature: string): Promise<void> {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(JSON.stringify(webhookData), signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const { webhook_type, webhook_code, item_id } = webhookData;

    this.logger.log(`Received Plaid webhook: ${webhook_type}:${webhook_code} for item ${item_id}`);

    try {
      switch (webhook_type) {
        case 'TRANSACTIONS':
          await this.handleTransactionWebhook(webhookData);
          break;
        case 'ACCOUNTS':
          await this.handleAccountWebhook(webhookData);
          break;
        case 'ITEM':
          await this.handleItemWebhook(webhookData);
          break;
        default:
          this.logger.log(`Unhandled webhook type: ${webhook_type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle webhook for item ${item_id}:`, error);
      throw error;
    }
  }

  private async handleTransactionWebhook(webhook: PlaidWebhookDto) {
    const { item_id, webhook_code } = webhook;

    // Get access token for the item
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
        await this.syncTransactions(accessToken, item_id);
        break;
      case 'TRANSACTIONS_REMOVED':
        // Handle removed transactions
        if (webhook.removed_transactions) {
          for (const removedId of webhook.removed_transactions) {
            await this.removeTransaction(removedId, item_id);
          }
        }
        break;
    }
  }

  private async handleAccountWebhook(webhook: PlaidWebhookDto) {
    // Handle account updates
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

    // Re-sync accounts to capture balance/metadata changes
    const request: AccountsGetRequest = {
      access_token: accessToken,
    };

    const response = await this.plaidClient!.accountsGet(request);

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

  private async handleItemWebhook(webhook: PlaidWebhookDto) {
    const { item_id, webhook_code, error } = webhook;

    switch (webhook_code) {
      case 'ERROR':
        this.logger.error(`Plaid item error for ${item_id}:`, error);

        // Mark connection as errored
        await this.prisma.providerConnection.updateMany({
          where: {
            provider: 'plaid',
            providerUserId: item_id,
          },
          data: {
            metadata: {
              error: error || 'Unknown error',
              erroredAt: new Date().toISOString(),
            },
          },
        });

        // Disable associated accounts
        await this.prisma.account.updateMany({
          where: {
            provider: 'plaid',
            metadata: {
              path: ['itemId'],
              equals: item_id,
            },
          },
          data: {
            // Note: Account model may not have isActive field
            // Store in metadata instead or update Prisma schema
          },
        });

        this.logger.log(`Disabled accounts for errored Plaid item ${item_id}`);
        break;

      case 'PENDING_EXPIRATION':
        this.logger.warn(`Plaid item ${item_id} will expire soon`);

        // Update connection to indicate pending expiration
        await this.prisma.providerConnection.updateMany({
          where: {
            provider: 'plaid',
            providerUserId: item_id,
          },
          data: {
            metadata: {
              pendingExpiration: true,
              expirationWarningAt: new Date().toISOString(),
            },
          },
        });

        // Note: Should trigger user notification in production
        // via email service or push notification
        break;

      case 'USER_PERMISSION_REVOKED':
        this.logger.log(`User revoked permissions for Plaid item ${item_id}`);

        // Mark connection as revoked
        await this.prisma.providerConnection.updateMany({
          where: {
            provider: 'plaid',
            providerUserId: item_id,
          },
          data: {
            metadata: {
              revokedAt: new Date().toISOString(),
            },
          },
        });

        // Disable all associated accounts
        await this.prisma.account.updateMany({
          where: {
            provider: 'plaid',
            metadata: {
              path: ['itemId'],
              equals: item_id,
            },
          },
          data: {
            // Note: Account model may not have isActive field
            // Store in metadata instead or update Prisma schema
          },
        });

        this.logger.log(`Disabled accounts for revoked Plaid item ${item_id}`);
        break;
    }
  }

  private verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret || !signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex') as any,
      Buffer.from(expectedSignature, 'hex') as any
    );
  }

  private mapAccountType(plaidType: string): AccountType {
    switch (plaidType.toLowerCase()) {
      case 'depository':
        return AccountType.checking; // Default for depository
      case 'credit':
        return AccountType.credit;
      case 'investment':
        return AccountType.investment;
      default:
        return AccountType.other;
    }
  }

  private mapCurrency(currency: string): Currency {
    const upperCurrency = currency?.toUpperCase();
    switch (upperCurrency) {
      case 'MXN':
        return Currency.MXN;
      case 'USD':
        return Currency.USD;
      case 'EUR':
        return Currency.EUR;
      default:
        // Default to USD for US-focused Plaid
        return Currency.USD;
    }
  }
}
