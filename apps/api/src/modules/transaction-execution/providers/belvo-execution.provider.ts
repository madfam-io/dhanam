import { Injectable, Logger } from '@nestjs/common';
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
 * Belvo Execution Provider
 * Handles SPEI bank transfers in Mexico via Belvo API
 *
 * PRODUCTION NOTES:
 * - Requires Belvo Payments product access
 * - SPEI (Sistema de Pagos Electrónicos Interbancarios) is Mexico's inter-bank transfer system
 * - Transfers typically settle same-day or next-day
 * - Webhook configuration required for async status updates
 * - Requires valid CLABE (standardized banking code) for recipients
 *
 * See: https://developers.belvo.com/docs/payments-overview
 */

interface BelvoPaymentIntentResponse {
  id: string;
  created_at: string;
  created_by: string;
  customer: string;
  allowed_payment_method_types: string[];
  amount: string;
  currency: string;
  description: string;
  failure_code: string | null;
  failure_message: string | null;
  metadata: any;
  next_step: {
    type: string;
    ready_to_confirm: boolean;
    pse_display_credentials_required?: boolean;
    pse_display_token_required?: boolean;
    pse_display_customer_bank_accounts?: any[];
  };
  provider: string;
  selected_payment_method_type: string | null;
  status: 'REQUIRES_ACTION' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REQUIRES_PAYMENT_METHOD';
}

interface BelvoPaymentTransactionResponse {
  id: string;
  created_at: string;
  created_by: string;
  amount: string;
  currency: string;
  description: string;
  transaction_type: 'OUTFLOW' | 'INFLOW';
  beneficiary: {
    name: string;
    account_number: string; // CLABE
    bank_code: string;
    email?: string;
  };
  payer: {
    name: string;
    account_number: string;
    bank_code: string;
  };
  payment_intent: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  tracking_id?: string; // SPEI tracking number
}

@Injectable()
export class BelvoExecutionProvider extends ExecutionProvider {
  private readonly logger = new Logger(BelvoExecutionProvider.name);
  private belvoClient: AxiosInstance | null = null;
  private readonly isProduction: boolean;

  readonly name = 'belvo';
  readonly capabilities: ProviderCapabilities = {
    supportsBuy: false, // Belvo doesn't support asset purchases
    supportsSell: false,
    supportsTransfer: true, // SPEI transfers between Mexican banks
    supportsDeposit: true, // SPEI deposits from external banks
    supportsWithdraw: true, // SPEI withdrawals to external banks
    supportsLimitOrders: false,
    supportsMarketOrders: false,
    minOrderAmount: 1,
    maxOrderAmount: 999999, // High limit for SPEI
    supportedCurrencies: ['MXN'],
    supportedAssets: [],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService
  ) {
    super();
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
    this.initializeBelvoClient();
  }

  private initializeBelvoClient() {
    const secretId = this.isProduction
      ? this.configService.get('BELVO_SECRET_ID')
      : this.configService.get('BELVO_SANDBOX_SECRET_ID');

    const secretPassword = this.isProduction
      ? this.configService.get('BELVO_SECRET_PASSWORD')
      : this.configService.get('BELVO_SANDBOX_SECRET_PASSWORD');

    if (!secretId || !secretPassword) {
      this.logger.warn('Belvo credentials not configured, execution disabled');
      return;
    }

    const baseURL = this.isProduction ? 'https://api.belvo.com' : 'https://sandbox.belvo.com';

    const authString = Buffer.from(`${secretId}:${secretPassword}`).toString('base64');

    this.belvoClient = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(
      `Belvo execution provider initialized (${this.isProduction ? 'production' : 'sandbox'})`
    );
  }

  async executeBuy(order: ExecutionOrder): Promise<ExecutionResult> {
    return {
      success: false,
      errorCode: 'NOT_SUPPORTED',
      errorMessage: 'Belvo does not support buy orders',
    };
  }

  async executeSell(order: ExecutionOrder): Promise<ExecutionResult> {
    return {
      success: false,
      errorCode: 'NOT_SUPPORTED',
      errorMessage: 'Belvo does not support sell orders',
    };
  }

  async executeTransfer(order: ExecutionOrder): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      if (!this.belvoClient) {
        throw new Error('Belvo client not initialized');
      }

      // Get account details
      const account = await this.getAccountDetails(order.accountId);
      if (!account.belvoLinkId) {
        throw new Error('Account not linked to Belvo');
      }

      // Get destination account for CLABE
      const destinationAccount = await this.getAccountDetails(order.toAccountId!);
      if (!destinationAccount.clabeNumber) {
        throw new Error('Destination account CLABE not found');
      }

      // Step 1: Create payment intent
      this.logger.log(`Creating Belvo payment intent for order ${order.id}`);

      const paymentIntent = await this.belvoClient.post<BelvoPaymentIntentResponse>(
        '/payments/payment-intents',
        {
          amount: order.amount.toString(),
          currency: 'MXN',
          description: order.metadata?.description || `Transfer for order ${order.id}`,
          customer: account.belvoCustomerId,
          allowed_payment_method_types: ['bank_transfer'],
          metadata: {
            order_id: order.id,
            account_id: order.accountId,
          },
        }
      );

      if (paymentIntent.data.status === 'FAILED') {
        return {
          success: false,
          errorCode: paymentIntent.data.failure_code || 'PAYMENT_INTENT_FAILED',
          errorMessage: paymentIntent.data.failure_message || 'Payment intent creation failed',
          rawResponse: paymentIntent.data,
          executionTime: Date.now() - startTime,
        };
      }

      // Step 2: Create SPEI payment transaction
      this.logger.log(`Creating Belvo SPEI transaction for order ${order.id}`);

      const transaction = await this.belvoClient.post<BelvoPaymentTransactionResponse>(
        '/payments/payment-transactions',
        {
          payment_intent: paymentIntent.data.id,
          payment_method_details: {
            type: 'bank_transfer',
            beneficiary: {
              name: destinationAccount.ownerName || 'Beneficiary',
              account_number: destinationAccount.clabeNumber, // 18-digit CLABE
              bank_code: this.extractBankCode(destinationAccount.clabeNumber),
            },
            payer: {
              name: account.ownerName || 'Payer',
              account_number: account.clabeNumber!,
              bank_code: this.extractBankCode(account.clabeNumber!),
            },
          },
          amount: order.amount.toString(),
          currency: 'MXN',
          description: order.metadata?.description || `Transfer for order ${order.id}`,
        }
      );

      // SPEI fees are typically MXN 3-8 per transaction
      const estimatedFee = 5; // Average SPEI fee

      return {
        success: true,
        providerOrderId: transaction.data.id,
        executedAmount: parseFloat(transaction.data.amount),
        executedPrice: 1, // 1:1 for MXN transfers
        fees: estimatedFee,
        feeCurrency: 'MXN',
        rawResponse: {
          paymentIntent: paymentIntent.data,
          transaction: transaction.data,
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Belvo transfer failed:', error);

      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          errorCode: error.response.data.code || 'BELVO_ERROR',
          errorMessage: error.response.data.message || error.message,
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
    // For deposits, we would create an inflow SPEI transaction
    return this.executeTransfer({
      ...order,
      metadata: {
        ...order.metadata,
        transactionType: 'INFLOW',
      },
    });
  }

  async executeWithdraw(order: ExecutionOrder): Promise<ExecutionResult> {
    // For withdrawals, we would create an outflow SPEI transaction
    return this.executeTransfer({
      ...order,
      metadata: {
        ...order.metadata,
        transactionType: 'OUTFLOW',
      },
    });
  }

  async getMarketPrice(assetSymbol: string, currency: string): Promise<number> {
    throw new Error('Belvo does not provide market prices');
  }

  async validateOrder(order: ExecutionOrder): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (!this.capabilities.supportedCurrencies.includes(order.currency.toUpperCase())) {
      errors.push(`Currency ${order.currency} is not supported by Belvo (MXN only)`);
    }

    if (order.amount < (this.capabilities.minOrderAmount || 0)) {
      errors.push(`Order amount below minimum: $${this.capabilities.minOrderAmount} MXN`);
    }

    if (this.capabilities.maxOrderAmount && order.amount > this.capabilities.maxOrderAmount) {
      errors.push(`Order amount exceeds maximum: $${this.capabilities.maxOrderAmount} MXN`);
    }

    // Validate destination account for transfers
    if (!order.toAccountId && order.type === 'transfer') {
      errors.push('Destination account required for SPEI transfers');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.belvoClient) {
        return false;
      }

      // Verify Belvo API is reachable
      const response = await this.belvoClient.get('/api/');

      return response.status === 200;
    } catch (error) {
      this.logger.error('Belvo health check failed:', error);
      return false;
    }
  }

  /**
   * Get SPEI transaction status
   * Called by webhook handler or polling
   */
  async getTransactionStatus(transactionId: string): Promise<any> {
    if (!this.belvoClient) {
      throw new Error('Belvo client not initialized');
    }

    const response = await this.belvoClient.get(`/payments/payment-transactions/${transactionId}`);

    return response.data;
  }

  /**
   * Helper: Extract bank code from CLABE number
   * First 3 digits of CLABE represent the bank
   */
  private extractBankCode(clabe: string): string {
    if (!clabe || clabe.length !== 18) {
      throw new Error('Invalid CLABE number (must be 18 digits)');
    }
    return clabe.substring(0, 3);
  }

  /**
   * Helper: Validate CLABE number
   * CLABE is an 18-digit standardized banking code in Mexico
   */
  private isValidClabe(clabe: string): boolean {
    if (!/^\d{18}$/.test(clabe)) {
      return false;
    }

    // Validate check digit (simplified - real validation uses modulo 10)
    const digits = clabe.split('').map(Number);
    const checkDigit = digits[17];

    // Weights for CLABE validation
    const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];

    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += (digits[i] * weights[i]) % 10;
    }

    const calculatedCheck = (10 - (sum % 10)) % 10;
    return calculatedCheck === checkDigit;
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
      belvoLinkId: metadata?.belvoLinkId,
      belvoCustomerId: metadata?.belvoCustomerId,
      clabeNumber: metadata?.clabeNumber,
      ownerName: metadata?.ownerName,
    };
  }
}
