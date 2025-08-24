import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CryptoService } from '../../../core/crypto/crypto.service';
import {
  PlaidApi,
  Configuration,
  PlaidEnvironments,
  CountryCode,
  Products,
  ItemPublicTokenExchangeRequest,
  LinkTokenCreateRequest,
  AccountsGetRequest,
  TransactionsGetRequest,
  TransactionsSyncRequest,
  WebhookVerificationKeyGetRequest,
} from 'plaid';
import { CreatePlaidLinkDto, PlaidWebhookDto } from './dto';
import { Account, Transaction } from '@dhanam/shared';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PlaidService {
  private readonly logger = new Logger(PlaidService.name);
  private plaidClient: PlaidApi | null = null;
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService,
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
            account_subtypes: ['checking', 'savings'],
          },
          credit: {
            account_subtypes: ['credit_card'],
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

  async createLink(
    spaceId: string,
    userId: string,
    dto: CreatePlaidLinkDto,
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
      const encryptedToken = await this.cryptoService.encrypt(access_token);
      await this.prisma.providerConnection.create({
        data: {
          provider: 'plaid',
          providerUserId: item_id,
          encryptedToken,
          metadata: {
            publicToken: dto.publicToken,
            itemId: item_id,
            externalId: dto.externalId,
            connectedAt: new Date().toISOString(),
          } as Prisma.JsonObject,
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
    itemId: string,
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
        currency: plaidAccount.balances.iso_currency_code || 'USD',
        balance: plaidAccount.balances.current || 0,
        lastSyncedAt: new Date(),
        metadata: {
          mask: plaidAccount.mask,
          officialName: plaidAccount.official_name,
          itemId,
          balances: plaidAccount.balances,
        } as Prisma.JsonObject,
      };

      const account = await this.prisma.account.create({ data: accountData });
      accounts.push(account as Account);
    }

    return accounts;
  }

  private async syncTransactions(accessToken: string, itemId: string) {
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
        `Synced transactions for item ${itemId}: ${added.length} added, ${modified.length} modified, ${removed.length} removed`,
      );
    } catch (error) {
      this.logger.error(`Failed to sync transactions for item ${itemId}:`, error);
    }
  }

  private async createTransactionFromPlaid(plaidTransaction: any, itemId: string) {
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
          } as Prisma.JsonObject,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        // Transaction already exists, skip
        return;
      }
      this.logger.error(`Failed to create transaction ${plaidTransaction.transaction_id}:`, error);
    }
  }

  private async updateTransactionFromPlaid(plaidTransaction: any, itemId: string) {
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
          } as Prisma.JsonObject,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update transaction ${plaidTransaction.transaction_id}:`, error);
    }
  }

  private async removeTransaction(transactionId: string, itemId: string) {
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

    const accessToken = await this.cryptoService.decrypt(connection.encryptedToken);

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
    // TODO: Implement account sync if needed
  }

  private async handleItemWebhook(webhook: PlaidWebhookDto) {
    const { item_id, webhook_code, error } = webhook;

    switch (webhook_code) {
      case 'ERROR':
        this.logger.error(`Plaid item error for ${item_id}:`, error);
        // TODO: Handle item errors (disable accounts, notify user)
        break;
      case 'PENDING_EXPIRATION':
        this.logger.warn(`Plaid item ${item_id} will expire soon`);
        // TODO: Notify user to re-authenticate
        break;
      case 'USER_PERMISSION_REVOKED':
        this.logger.log(`User revoked permissions for Plaid item ${item_id}`);
        // TODO: Disable accounts and stop syncing
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
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  }

  private mapAccountType(plaidType: string): 'checking' | 'savings' | 'credit' | 'investment' | 'other' {
    switch (plaidType.toLowerCase()) {
      case 'depository':
        return 'checking'; // Default for depository
      case 'credit':
        return 'credit';
      case 'investment':
        return 'investment';
      default:
        return 'other';
    }
  }
}