import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import { CryptoService } from '../../../core/crypto/crypto.service';
import { PrismaService } from '../../../core/prisma/prisma.service';

import {
  ExecutionProvider,
  ExecutionOrder,
  ExecutionResult,
  ProviderCapabilities,
} from './execution-provider.interface';

/**
 * Plaid Execution Provider
 * Handles ACH transfers via Plaid Transfer API
 *
 * PRODUCTION NOTES:
 * - Requires Plaid Transfer product access (not available in sandbox)
 * - Requires RTP or same-day ACH enabled accounts
 * - Transfer limits vary by bank and account type
 * - Webhook configuration required for async status updates
 *
 * See: https://plaid.com/docs/transfer/
 */

interface PlaidTransferAuthorizationResponse {
  authorization: {
    id: string;
    created: string;
    decision: 'approved' | 'declined';
    decision_rationale: {
      code: string;
      description: string;
    } | null;
  };
  request_id: string;
}

interface PlaidTransferCreateResponse {
  transfer: {
    id: string;
    ach_class: string;
    account_id: string;
    amount: string;
    created: string;
    description: string;
    metadata: any;
    network: 'ach' | 'same-day-ach' | 'rtp';
    status: 'pending' | 'posted' | 'settled' | 'cancelled' | 'failed' | 'returned';
  };
  request_id: string;
}

@Injectable()
export class PlaidExecutionProvider extends ExecutionProvider {
  private readonly logger = new Logger(PlaidExecutionProvider.name);
  private plaidClient: AxiosInstance | null = null;
  private readonly isProduction: boolean;

  readonly name = 'plaid';
  readonly capabilities: ProviderCapabilities = {
    supportsBuy: false, // Plaid doesn't support asset purchases
    supportsSell: false,
    supportsTransfer: true, // ACH transfers between accounts
    supportsDeposit: true, // ACH deposits from external accounts
    supportsWithdraw: true, // ACH withdrawals to external accounts
    supportsLimitOrders: false,
    supportsMarketOrders: false,
    minOrderAmount: 1,
    maxOrderAmount: 25000, // Typical same-day ACH limit
    supportedCurrencies: ['USD'],
    supportedAssets: [],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService
  ) {
    super();
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
    this.initializePlaidClient();
  }

  private initializePlaidClient() {
    const clientId = this.configService.get('PLAID_CLIENT_ID');
    const secret = this.isProduction
      ? this.configService.get('PLAID_SECRET')
      : this.configService.get('PLAID_SANDBOX_SECRET');

    if (!clientId || !secret) {
      this.logger.warn('Plaid credentials not configured, execution disabled');
      return;
    }

    const baseURL = this.isProduction
      ? 'https://production.plaid.com'
      : 'https://sandbox.plaid.com';

    this.plaidClient = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'PLAID-CLIENT-ID': clientId,
        'PLAID-SECRET': secret,
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(
      `Plaid execution provider initialized (${this.isProduction ? 'production' : 'sandbox'})`
    );
  }

  async executeBuy(order: ExecutionOrder): Promise<ExecutionResult> {
    return {
      success: false,
      errorCode: 'NOT_SUPPORTED',
      errorMessage: 'Plaid does not support buy orders',
    };
  }

  async executeSell(order: ExecutionOrder): Promise<ExecutionResult> {
    return {
      success: false,
      errorCode: 'NOT_SUPPORTED',
      errorMessage: 'Plaid does not support sell orders',
    };
  }

  async executeTransfer(order: ExecutionOrder): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      if (!this.plaidClient) {
        throw new Error('Plaid client not initialized');
      }

      // Get account details
      const account = await this.getAccountDetails(order.accountId);
      if (!account.plaidAccessToken) {
        throw new Error('Account not linked to Plaid');
      }

      const accessToken = this.cryptoService.decrypt(JSON.parse(account.plaidAccessToken));

      // Step 1: Create transfer authorization
      this.logger.log(`Creating Plaid transfer authorization for order ${order.id}`);

      const authResponse = await this.plaidClient.post<PlaidTransferAuthorizationResponse>(
        '/transfer/authorization/create',
        {
          access_token: accessToken,
          account_id: account.plaidAccountId,
          type: 'debit', // or 'credit' based on transfer direction
          network: 'same-day-ach', // or 'ach' for standard
          amount: order.amount.toString(),
          ach_class: 'ppd', // prearranged payment and deposit
          user: {
            legal_name: account.ownerName || 'Account Owner',
          },
        }
      );

      if (authResponse.data.authorization.decision !== 'approved') {
        return {
          success: false,
          errorCode: 'AUTHORIZATION_DECLINED',
          errorMessage:
            authResponse.data.authorization.decision_rationale?.description ||
            'Transfer authorization declined',
          rawResponse: authResponse.data,
          executionTime: Date.now() - startTime,
        };
      }

      // Step 2: Create the transfer
      this.logger.log(`Creating Plaid transfer for order ${order.id}`);

      const transferResponse = await this.plaidClient.post<PlaidTransferCreateResponse>(
        '/transfer/create',
        {
          access_token: accessToken,
          account_id: account.plaidAccountId,
          authorization_id: authResponse.data.authorization.id,
          description: order.metadata?.description || `Transfer for order ${order.id}`,
          metadata: {
            order_id: order.id,
            account_id: order.accountId,
          },
        }
      );

      const transfer = transferResponse.data.transfer;

      // Calculate fees (Plaid charges ~$0.25-0.50 per transfer)
      const estimatedFee = order.amount > 10000 ? 0.5 : 0.25;

      return {
        success: true,
        providerOrderId: transfer.id,
        executedAmount: parseFloat(transfer.amount),
        executedPrice: 1, // 1:1 for USD transfers
        fees: estimatedFee,
        feeCurrency: 'USD',
        rawResponse: transferResponse.data,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Plaid transfer failed:', error);

      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          errorCode: error.response.data.error_code || 'PLAID_ERROR',
          errorMessage: error.response.data.error_message || error.message,
          rawResponse: error.response.data,
          executionTime: Date.now() - startTime,
        };
      }

      return {
        success: false,
        errorCode: 'EXECUTION_ERROR',
        errorMessage: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  }

  async executeDeposit(order: ExecutionOrder): Promise<ExecutionResult> {
    // For deposits, we would create a credit transfer
    return this.executeTransfer({
      ...order,
      metadata: {
        ...order.metadata,
        transferType: 'credit',
      },
    });
  }

  async executeWithdraw(order: ExecutionOrder): Promise<ExecutionResult> {
    // For withdrawals, we would create a debit transfer
    return this.executeTransfer({
      ...order,
      metadata: {
        ...order.metadata,
        transferType: 'debit',
      },
    });
  }

  async getMarketPrice(assetSymbol: string, currency: string): Promise<number> {
    throw new Error('Plaid does not provide market prices');
  }

  async validateOrder(order: ExecutionOrder): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (!this.capabilities.supportedCurrencies.includes(order.currency.toUpperCase())) {
      errors.push(`Currency ${order.currency} is not supported by Plaid`);
    }

    if (order.amount < (this.capabilities.minOrderAmount || 0)) {
      errors.push(`Order amount below minimum: $${this.capabilities.minOrderAmount}`);
    }

    if (this.capabilities.maxOrderAmount && order.amount > this.capabilities.maxOrderAmount) {
      errors.push(
        `Order amount exceeds same-day ACH maximum: $${this.capabilities.maxOrderAmount}`
      );
    }

    // Validate destination account for transfers
    if (!order.toAccountId && order.type === 'transfer') {
      errors.push('Destination account required for transfers');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.plaidClient) {
        return false;
      }

      // Verify Plaid API is reachable
      const response = await this.plaidClient.post('/item/get', {
        access_token: 'test_token', // This will fail but confirms API is up
      });

      return false; // We expect this to fail with invalid token
    } catch (error) {
      // If we get a proper error response, API is healthy
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        return true; // API is responding
      }
      return false;
    }
  }

  /**
   * Get Plaid transfer status
   * Called by webhook handler or polling
   */
  async getTransferStatus(transferId: string): Promise<any> {
    if (!this.plaidClient) {
      throw new Error('Plaid client not initialized');
    }

    const response = await this.plaidClient.post('/transfer/get', {
      transfer_id: transferId,
    });

    return response.data.transfer;
  }

  /**
   * Helper: Get account details from database
   */
  private async getAccountDetails(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const metadata = account.metadata as any;

    return {
      id: account.id,
      plaidAccessToken: metadata?.plaidAccessToken,
      plaidAccountId: metadata?.plaidAccountId,
      ownerName: metadata?.ownerName,
    };
  }
}
