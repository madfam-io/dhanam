import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Provider } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

import {
  IFinancialProvider,
  ProviderHealthCheck,
  CreateLinkParams,
  LinkResult,
  ExchangeTokenParams,
  ExchangeTokenResult,
  GetAccountsParams,
  ProviderAccount,
  SyncTransactionsParams,
  SyncTransactionsResult,
  WebhookHandlerResult,
  InstitutionInfo,
} from '../orchestrator/provider.interface';

/**
 * MX Platform Integration - Backup provider for Plaid/Belvo
 * MX provides financial data aggregation across US, MX, and other regions
 * https://docs.mx.com/
 */
@Injectable()
export class MxService implements IFinancialProvider {
  readonly name = Provider.mx;
  private readonly logger = new Logger(MxService.name);
  private readonly apiKey: string;
  private readonly clientId: string;
  private readonly baseUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    this.apiKey = this.configService.get('MX_API_KEY', '');
    this.clientId = this.configService.get('MX_CLIENT_ID', '');
    this.baseUrl = this.configService.get(
      'MX_BASE_URL',
      'https://int-api.mx.com' // Default to integration environment
    );

    if (!this.apiKey || !this.clientId) {
      this.logger.warn('MX credentials not configured, service disabled');
    } else {
      this.logger.log('MX service initialized');
    }
  }

  async healthCheck(): Promise<ProviderHealthCheck> {
    const startTime = Date.now();

    if (!this.apiKey || !this.clientId) {
      return {
        provider: Provider.mx,
        status: 'down',
        errorRate: 100,
        avgResponseTimeMs: 0,
        lastCheckedAt: new Date(),
        error: 'MX not configured',
      };
    }

    try {
      // TODO: Call MX ping endpoint
      const responseTimeMs = Date.now() - startTime;

      return {
        provider: Provider.mx,
        status: 'healthy',
        errorRate: 0,
        avgResponseTimeMs: responseTimeMs,
        lastCheckedAt: new Date(),
      };
    } catch (error: any) {
      return {
        provider: Provider.mx,
        status: 'down',
        errorRate: 100,
        avgResponseTimeMs: Date.now() - startTime,
        lastCheckedAt: new Date(),
        error: error.message,
      };
    }
  }

  async createLink(params: CreateLinkParams): Promise<LinkResult> {
    if (!this.apiKey) {
      throw new BadRequestException('MX integration not configured');
    }

    // TODO: Implement MX widget URL creation
    // https://docs.mx.com/api/connect#connect_widget
    this.logger.warn('MX createLink not yet implemented');

    throw new BadRequestException('MX integration coming soon');
  }

  async exchangeToken(params: ExchangeTokenParams): Promise<ExchangeTokenResult> {
    if (!this.apiKey) {
      throw new BadRequestException('MX integration not configured');
    }

    // TODO: Implement MX member creation
    // https://docs.mx.com/api/connect#create_member
    this.logger.warn('MX exchangeToken not yet implemented');

    throw new BadRequestException('MX integration coming soon');
  }

  async getAccounts(params: GetAccountsParams): Promise<ProviderAccount[]> {
    if (!this.apiKey) {
      throw new BadRequestException('MX integration not configured');
    }

    // TODO: Implement MX accounts fetching
    // https://docs.mx.com/api/connect#list_accounts
    this.logger.warn('MX getAccounts not yet implemented');

    throw new BadRequestException('MX integration coming soon');
  }

  async syncTransactions(params: SyncTransactionsParams): Promise<SyncTransactionsResult> {
    if (!this.apiKey) {
      throw new BadRequestException('MX integration not configured');
    }

    // TODO: Implement MX transactions sync
    // https://docs.mx.com/api/connect#list_transactions
    this.logger.warn('MX syncTransactions not yet implemented');

    throw new BadRequestException('MX integration coming soon');
  }

  async handleWebhook(payload: any, signature?: string): Promise<WebhookHandlerResult> {
    if (!this.apiKey) {
      throw new BadRequestException('MX integration not configured');
    }

    // TODO: Implement MX webhook handling
    // https://docs.mx.com/api/connect#webhooks
    this.logger.warn('MX handleWebhook not yet implemented');

    return {
      processed: false,
      error: 'MX webhook handling not implemented',
    };
  }

  async searchInstitutions(query: string, region?: string): Promise<InstitutionInfo[]> {
    if (!this.apiKey) {
      throw new BadRequestException('MX integration not configured');
    }

    // TODO: Implement MX institution search
    // https://docs.mx.com/api/connect#list_institutions
    this.logger.warn('MX searchInstitutions not yet implemented');

    return [];
  }

  async getInstitution(institutionId: string): Promise<InstitutionInfo> {
    if (!this.apiKey) {
      throw new BadRequestException('MX integration not configured');
    }

    // TODO: Implement MX institution details
    // https://docs.mx.com/api/connect#read_institution
    this.logger.warn('MX getInstitution not yet implemented');

    throw new BadRequestException('MX integration coming soon');
  }
}

/**
 * Implementation Notes:
 *
 * MX API Overview:
 * - Base URL: https://int-api.mx.com (integration) or https://api.mx.com (production)
 * - Authentication: Basic Auth with client_id:api_key
 * - Rate Limits: 1000 requests per minute
 *
 * Key Endpoints:
 * 1. Create User: POST /users
 * 2. Create Member (connection): POST /users/{user_guid}/members
 * 3. List Accounts: GET /users/{user_guid}/accounts
 * 4. List Transactions: GET /users/{user_guid}/transactions
 * 5. Get Institution: GET /institutions/{institution_code}
 *
 * Webhook Events:
 * - MEMBER.CREATED
 * - MEMBER.UPDATED
 * - ACCOUNT.CREATED
 * - TRANSACTION.CREATED
 *
 * Error Codes to Handle:
 * - 401: Invalid credentials
 * - 429: Rate limit exceeded
 * - 503: Service unavailable
 *
 * Next Steps for Full Implementation:
 * 1. Add mx library to package.json: @atrium-io/mx-platform-node
 * 2. Implement createLink using MX Connect Widget
 * 3. Map MX account types to our AccountType enum
 * 4. Map MX transaction categories to our categories
 * 5. Store MX member_guid in encryptedCredentials
 * 6. Implement cursor-based pagination for transactions
 * 7. Add webhook signature verification
 */
