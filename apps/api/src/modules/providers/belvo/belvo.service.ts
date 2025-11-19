import * as crypto from 'crypto';

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Account, Transaction, Prisma, Currency, AccountType } from '@prisma/client';

import { AuditService } from '@core/audit/audit.service';
import { CryptoService } from '@core/crypto/crypto.service';
import { MonitorPerformance } from '@core/decorators/monitor-performance.decorator';
import { PrismaService } from '@core/prisma/prisma.service';

import { CreateBelvoLinkDto, BelvoWebhookDto, BelvoWebhookEvent } from './dto';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: Belvo } = require('belvo');

@Injectable()
export class BelvoService {
  private readonly logger = new Logger(BelvoService.name);
  private belvoClient: any;
  private readonly webhookSecret: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private cryptoService: CryptoService,
    private auditService: AuditService
  ) {
    const secretKeyId = this.configService.get<string>('BELVO_SECRET_KEY_ID');
    const secretKeyPassword = this.configService.get<string>('BELVO_SECRET_KEY_PASSWORD');
    const environment = this.configService.get<string>('BELVO_ENV', 'sandbox');

    this.webhookSecret = this.configService.get('BELVO_WEBHOOK_SECRET', '');

    if (secretKeyId && secretKeyPassword) {
      this.belvoClient = new Belvo(secretKeyId, secretKeyPassword, environment);
    } else {
      this.logger.warn('Belvo credentials not configured');
    }
  }

  async createLink(
    spaceId: string,
    userId: string,
    dto: CreateBelvoLinkDto
  ): Promise<{ linkId: string; accounts: Account[] }> {
    if (!this.belvoClient) {
      throw new BadRequestException('Belvo integration not configured');
    }

    try {
      // Create link in Belvo
      const link = await this.belvoClient.links.register(
        dto.institution,
        dto.username,
        dto.password,
        {
          external_id: dto.externalId,
          access_mode: 'recurrent',
        }
      );

      // Store encrypted link
      const encryptedLinkId = this.cryptoService.encrypt(link.id);
      await this.prisma.providerConnection.create({
        data: {
          provider: 'belvo',
          providerUserId: link.id,
          encryptedToken: JSON.stringify(encryptedLinkId),
          metadata: {
            institution: dto.institution,
            createdAt: new Date().toISOString(),
          } as Prisma.JsonObject,
          user: { connect: { id: userId } },
        },
      });

      // Fetch accounts immediately
      const belvoAccounts = await this.belvoClient.accounts.retrieve(link.id);

      // Convert and store accounts
      const accounts = await this.syncAccounts(spaceId, userId, link.id, belvoAccounts);

      // Fetch initial transactions
      await this.syncTransactions(spaceId, userId, link.id);

      // Log successful connection
      await this.auditService.logProviderConnection('belvo', userId, spaceId, true);

      return { linkId: link.id, accounts };
    } catch (error) {
      // Log failed connection
      await this.auditService.logProviderConnection('belvo', userId, spaceId, false);

      this.logger.error('Failed to create Belvo link', error);
      throw new BadRequestException('Failed to connect to financial institution');
    }
  }

  async syncAccounts(
    spaceId: string,
    _userId: string,
    linkId: string,
    belvoAccounts?: any[]
  ): Promise<Account[]> {
    if (!this.belvoClient) {
      throw new BadRequestException('Belvo integration not configured');
    }

    try {
      // Fetch accounts if not provided
      if (!belvoAccounts) {
        belvoAccounts = await this.belvoClient.accounts.retrieve(linkId);
      }

      const accounts: Account[] = [];

      for (const belvoAccount of belvoAccounts!) {
        const accountType = this.mapBelvoAccountType(belvoAccount.category);

        // Check if account already exists
        const existingAccount = await this.prisma.account.findFirst({
          where: {
            spaceId,
            provider: 'belvo',
            providerAccountId: belvoAccount.id,
          },
        });

        if (existingAccount) {
          // Update existing account
          const updated = await this.prisma.account.update({
            where: { id: existingAccount.id },
            data: {
              name: belvoAccount.name,
              balance: belvoAccount.balance.current,
              currency: this.mapCurrency(belvoAccount.currency),
              lastSyncedAt: new Date(),
              metadata: {
                ...(existingAccount.metadata as object),
                institution: belvoAccount.institution.name,
                number: belvoAccount.number,
              } as Prisma.JsonObject,
            },
          });
          accounts.push(updated);
        } else {
          // Create new account
          const created = await this.prisma.account.create({
            data: {
              spaceId,
              provider: 'belvo',
              providerAccountId: belvoAccount.id,
              name: belvoAccount.name,
              type: accountType,
              subtype: belvoAccount.type,
              currency: this.mapCurrency(belvoAccount.currency),
              balance: belvoAccount.balance.current,
              lastSyncedAt: new Date(),
              metadata: {
                linkId,
                institution: belvoAccount.institution.name,
                number: belvoAccount.number,
              } as Prisma.JsonObject,
            },
          });
          accounts.push(created);
        }
      }

      return accounts;
    } catch (error) {
      this.logger.error('Failed to sync Belvo accounts', error);
      throw new BadRequestException('Failed to sync accounts');
    }
  }

  async syncTransactions(
    spaceId: string,
    _userId: string,
    linkId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<Transaction[]>;
  async syncTransactions(
    accessToken: string,
    linkId: string,
    cursor?: string
  ): Promise<{ transactionCount: number; accountCount: number; nextCursor?: string }>;
  @MonitorPerformance(2000) // 2 second threshold for transaction sync
  async syncTransactions(
    spaceIdOrAccessToken: string,
    userIdOrLinkId: string,
    linkIdOrCursor?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<
    Transaction[] | { transactionCount: number; accountCount: number; nextCursor?: string }
  > {
    if (!this.belvoClient) {
      throw new BadRequestException('Belvo integration not configured');
    }

    // Check if this is the new overloaded signature (3 parameters with different meaning)
    if (typeof linkIdOrCursor === 'string' && dateFrom === undefined && dateTo === undefined) {
      // This is the new signature: syncTransactions(accessToken, linkId, cursor?)
      // accessToken parameter not needed in our implementation
      const linkId = userIdOrLinkId;
      const cursor = linkIdOrCursor;

      try {
        // Get connection to find space
        const connection = await this.prisma.providerConnection.findFirst({
          where: {
            provider: 'belvo',
            providerUserId: linkId,
          },
          include: {
            user: {
              include: {
                userSpaces: {
                  include: { space: true },
                },
              },
            },
          },
        });

        if (!connection) {
          throw new Error(`No connection found for Belvo link: ${linkId}`);
        }

        const spaceId = connection.user.userSpaces[0]?.space?.id;
        if (!spaceId) {
          throw new Error(`No space found for user: ${connection.userId}`);
        }

        // Default to last 90 days if no cursor
        const endDate = new Date().toISOString().split('T')[0];
        const startDate =
          cursor || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Fetch transactions from Belvo
        const belvoTransactions = await this.belvoClient.transactions.retrieve(
          linkId,
          startDate,
          endDate
        );

        let transactionCount = 0;

        for (const belvoTx of belvoTransactions) {
          // Find the corresponding account
          const account = await this.prisma.account.findFirst({
            where: {
              spaceId,
              provider: 'belvo',
              providerAccountId: belvoTx.account.id,
            },
          });

          if (!account) {
            this.logger.warn(`Account not found for transaction: ${belvoTx.id}`);
            continue;
          }

          // Check if transaction already exists
          const existingTx = await this.prisma.transaction.findFirst({
            where: {
              accountId: account.id,
              metadata: {
                path: ['belvoId'],
                equals: belvoTx.id,
              },
            },
          });

          if (!existingTx) {
            // Create new transaction
            await this.prisma.transaction.create({
              data: {
                accountId: account.id,
                amount: belvoTx.type === 'INFLOW' ? belvoTx.amount : -belvoTx.amount,
                currency: account.currency as Currency,
                date: new Date(belvoTx.value_date),
                description: belvoTx.description,
                merchant: belvoTx.merchant?.name || null,
                metadata: {
                  belvoId: belvoTx.id,
                  category: belvoTx.category,
                  type: belvoTx.type,
                  status: belvoTx.status,
                  mcc: belvoTx.mcc,
                } as Prisma.JsonObject,
              },
            });
            transactionCount++;
          }
        }

        return {
          transactionCount,
          accountCount: 1,
          nextCursor: endDate,
        };
      } catch (error) {
        this.logger.error('Failed to sync Belvo transactions via job', error);
        throw error;
      }
    }

    // Original signature: syncTransactions(spaceId, userId, linkId, dateFrom?, dateTo?)
    const spaceId = spaceIdOrAccessToken;
    // userId parameter not used in this implementation
    const linkId = linkIdOrCursor!;

    try {
      // Default to last 90 days if not specified
      const endDate = dateTo || new Date().toISOString().split('T')[0];
      const startDate =
        dateFrom || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch transactions from Belvo
      const belvoTransactions = await this.belvoClient.transactions.retrieve(
        linkId,
        startDate,
        endDate
      );

      const transactions: Transaction[] = [];

      for (const belvoTx of belvoTransactions) {
        // Find the corresponding account
        const account = await this.prisma.account.findFirst({
          where: {
            spaceId,
            provider: 'belvo',
            providerAccountId: belvoTx.account.id,
          },
        });

        if (!account) {
          this.logger.warn(`Account not found for transaction: ${belvoTx.id}`);
          continue;
        }

        // Check if transaction already exists
        const existingTx = await this.prisma.transaction.findFirst({
          where: {
            accountId: account.id,
            metadata: {
              path: ['belvoId'],
              equals: belvoTx.id,
            },
          },
        });

        if (!existingTx) {
          // Create new transaction
          const created = await this.prisma.transaction.create({
            data: {
              accountId: account.id,
              amount: belvoTx.type === 'INFLOW' ? belvoTx.amount : -belvoTx.amount,
              currency: account.currency as Currency,
              date: new Date(belvoTx.value_date),
              description: belvoTx.description,
              merchant: belvoTx.merchant?.name || null,
              metadata: {
                belvoId: belvoTx.id,
                category: belvoTx.category,
                type: belvoTx.type,
                status: belvoTx.status,
                mcc: belvoTx.mcc,
              } as Prisma.JsonObject,
            },
          });
          transactions.push(created);
        }
      }

      return transactions;
    } catch (error) {
      this.logger.error('Failed to sync Belvo transactions', error);
      throw new BadRequestException('Failed to sync transactions');
    }
  }

  async handleWebhook(dto: BelvoWebhookDto, signature: string): Promise<void> {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(JSON.stringify(dto), signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Received Belvo webhook: ${dto.event}`);

    // Find the connection
    const connection = await this.prisma.providerConnection.findFirst({
      where: {
        provider: 'belvo',
        providerUserId: dto.link_id,
      },
      include: {
        user: {
          include: {
            userSpaces: {
              include: {
                space: true,
              },
            },
          },
        },
      },
    });

    if (!connection) {
      this.logger.warn(`No connection found for link: ${dto.link_id}`);
      return;
    }

    // Get the first space (TODO: handle multiple spaces)
    const space = connection.user.userSpaces[0]?.space;
    if (!space) {
      this.logger.warn(`No space found for user: ${connection.userId}`);
      return;
    }

    switch (dto.event) {
      case BelvoWebhookEvent.ACCOUNTS_CREATED:
        await this.syncAccounts(space.id, connection.userId, dto.link_id);
        break;
      case BelvoWebhookEvent.TRANSACTIONS_CREATED:
        await this.syncTransactions(space.id, connection.userId, dto.link_id);
        break;
      case BelvoWebhookEvent.LINK_FAILED:
        // TODO: Handle link failure
        this.logger.error(`Link failed: ${dto.link_id}`, dto.data);
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${dto.event}`);
    }
  }

  async deleteLink(userId: string, linkId: string): Promise<void> {
    if (!this.belvoClient) {
      throw new BadRequestException('Belvo integration not configured');
    }

    try {
      // Delete from Belvo
      await this.belvoClient.links.delete(linkId);

      // Delete connection record
      await this.prisma.providerConnection.deleteMany({
        where: {
          userId,
          provider: 'belvo',
          providerUserId: linkId,
        },
      });

      // TODO: Handle account/transaction cleanup
    } catch (error) {
      this.logger.error('Failed to delete Belvo link', error);
      throw new BadRequestException('Failed to disconnect account');
    }
  }

  private mapBelvoAccountType(category: string): AccountType {
    const mapping: Record<string, AccountType> = {
      CHECKING_ACCOUNT: 'checking',
      CREDIT_CARD: 'credit',
      LOAN_ACCOUNT: 'other',
      SAVINGS_ACCOUNT: 'savings',
      INVESTMENT_ACCOUNT: 'investment',
    };
    return mapping[category] || 'other';
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
        // Default to MXN for Mexico-focused Belvo
        return Currency.MXN;
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
}
