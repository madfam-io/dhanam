import * as crypto from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { CryptoService } from '../../../core/crypto/crypto.service';

import {
  ExecutionProvider,
  ExecutionOrder,
  ExecutionResult,
  ProviderCapabilities,
  OrderType,
} from './execution-provider.interface';

interface BitsoOrderResponse {
  success: boolean;
  payload?: {
    oid: string;
    book: string;
    original_amount: string;
    unfilled_amount: string;
    original_value: string;
    created_at: string;
    updated_at: string;
    price: string;
    side: 'buy' | 'sell';
    status: string;
    type: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface BitsoTicker {
  book: string;
  volume: string;
  high: string;
  last: string;
  low: string;
  vwap: string;
  ask: string;
  bid: string;
  created_at: string;
}

@Injectable()
export class BitsoExecutionProvider extends ExecutionProvider {
  private readonly logger = new Logger(BitsoExecutionProvider.name);
  private bitsoClient: AxiosInstance | null = null;

  readonly name = 'bitso';
  readonly capabilities: ProviderCapabilities = {
    supportsBuy: true,
    supportsSell: true,
    supportsTransfer: false, // Bitso doesn't support internal transfers via API
    supportsDeposit: false, // Deposits handled separately
    supportsWithdraw: false, // Withdrawals handled separately
    supportsLimitOrders: true,
    supportsMarketOrders: true,
    minOrderAmount: 0.001,
    maxOrderAmount: 1000000,
    supportedCurrencies: ['MXN', 'USD'],
    supportedAssets: ['BTC', 'ETH', 'XRP', 'LTC', 'BCH', 'TUSD', 'DAI', 'USDC', 'MANA'],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService
  ) {
    super();
    this.initializeBitsoClient();
  }

  private initializeBitsoClient() {
    const apiKey = this.configService.get('BITSO_API_KEY');
    const apiSecret = this.configService.get('BITSO_API_SECRET');

    if (!apiKey || !apiSecret) {
      this.logger.warn('Bitso credentials not configured');
      return;
    }

    this.bitsoClient = axios.create({
      baseURL: 'https://api.bitso.com/v3',
      timeout: 30000,
    });

    // Add request interceptor for authentication
    this.bitsoClient.interceptors.request.use((config) => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const method = config.method?.toUpperCase() || 'GET';
      const requestPath = config.url || '';
      const body = config.data ? JSON.stringify(config.data) : '';

      const message = timestamp + method + '/v3' + requestPath + body;
      const signature = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');

      config.headers['Authorization'] = `Bitso ${apiKey}:${timestamp}:${signature}`;
      config.headers['Content-Type'] = 'application/json';

      return config;
    });

    this.logger.log('Bitso execution provider initialized');
  }

  async executeBuy(order: ExecutionOrder): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      if (!this.bitsoClient) {
        throw new Error('Bitso client not initialized');
      }

      // Get account credentials
      const account = await this.getAccountCredentials(order.accountId);

      // Create temporary client with account credentials
      const client = this.createTempClient(account.apiKey, account.apiSecret);

      // Build order book symbol (e.g., btc_mxn)
      const book = `${order.assetSymbol?.toLowerCase()}_${order.currency.toLowerCase()}`;

      // Determine order type
      const orderType = order.targetPrice ? 'limit' : 'market';

      // Build order payload
      const orderPayload: any = {
        book,
        side: 'buy',
        type: orderType,
        major: order.amount.toString(), // Amount of crypto to buy
      };

      if (orderType === 'limit' && order.targetPrice) {
        orderPayload.price = order.targetPrice.toString();
      }

      // Place order
      this.logger.log(`Placing Bitso buy order: ${JSON.stringify(orderPayload)}`);
      const response = await client.post<BitsoOrderResponse>('/orders', orderPayload);

      if (response.data.success && response.data.payload) {
        const payload = response.data.payload;
        const executedAmount = parseFloat(payload.original_amount);
        const executedPrice = parseFloat(payload.price);
        const estimatedFees = executedAmount * executedPrice * 0.001; // 0.1% Bitso fee

        return {
          success: true,
          providerOrderId: payload.oid,
          executedAmount,
          executedPrice,
          fees: estimatedFees,
          feeCurrency: order.currency,
          rawResponse: response.data,
          executionTime: Date.now() - startTime,
        };
      } else {
        return {
          success: false,
          errorCode: response.data.error?.code || 'UNKNOWN_ERROR',
          errorMessage: response.data.error?.message || 'Unknown error',
          rawResponse: response.data,
          executionTime: Date.now() - startTime,
        };
      }
    } catch (error) {
      this.logger.error('Bitso buy order failed:', error);
      return {
        success: false,
        errorCode: 'EXECUTION_ERROR',
        errorMessage: error.message,
        rawResponse: error.response?.data,
        executionTime: Date.now() - startTime,
      };
    }
  }

  async executeSell(order: ExecutionOrder): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      if (!this.bitsoClient) {
        throw new Error('Bitso client not initialized');
      }

      const account = await this.getAccountCredentials(order.accountId);
      const client = this.createTempClient(account.apiKey, account.apiSecret);

      const book = `${order.assetSymbol?.toLowerCase()}_${order.currency.toLowerCase()}`;
      const orderType = order.targetPrice ? 'limit' : 'market';

      const orderPayload: any = {
        book,
        side: 'sell',
        type: orderType,
        major: order.amount.toString(), // Amount of crypto to sell
      };

      if (orderType === 'limit' && order.targetPrice) {
        orderPayload.price = order.targetPrice.toString();
      }

      this.logger.log(`Placing Bitso sell order: ${JSON.stringify(orderPayload)}`);
      const response = await client.post<BitsoOrderResponse>('/orders', orderPayload);

      if (response.data.success && response.data.payload) {
        const payload = response.data.payload;
        const executedAmount = parseFloat(payload.original_amount);
        const executedPrice = parseFloat(payload.price);
        const estimatedFees = executedAmount * executedPrice * 0.001;

        return {
          success: true,
          providerOrderId: payload.oid,
          executedAmount,
          executedPrice,
          fees: estimatedFees,
          feeCurrency: order.currency,
          rawResponse: response.data,
          executionTime: Date.now() - startTime,
        };
      } else {
        return {
          success: false,
          errorCode: response.data.error?.code || 'UNKNOWN_ERROR',
          errorMessage: response.data.error?.message || 'Unknown error',
          rawResponse: response.data,
          executionTime: Date.now() - startTime,
        };
      }
    } catch (error) {
      this.logger.error('Bitso sell order failed:', error);
      return {
        success: false,
        errorCode: 'EXECUTION_ERROR',
        errorMessage: error.message,
        rawResponse: error.response?.data,
        executionTime: Date.now() - startTime,
      };
    }
  }

  async executeTransfer(order: ExecutionOrder): Promise<ExecutionResult> {
    return {
      success: false,
      errorCode: 'NOT_SUPPORTED',
      errorMessage: 'Bitso does not support transfers via API',
    };
  }

  async executeDeposit(order: ExecutionOrder): Promise<ExecutionResult> {
    return {
      success: false,
      errorCode: 'NOT_SUPPORTED',
      errorMessage: 'Bitso deposits must be initiated externally',
    };
  }

  async executeWithdraw(order: ExecutionOrder): Promise<ExecutionResult> {
    return {
      success: false,
      errorCode: 'NOT_SUPPORTED',
      errorMessage: 'Bitso withdrawals require additional KYC verification',
    };
  }

  async getMarketPrice(assetSymbol: string, currency: string): Promise<number> {
    try {
      const book = `${assetSymbol.toLowerCase()}_${currency.toLowerCase()}`;
      const response = await axios.get<{ success: boolean; payload: BitsoTicker }>(
        `https://api.bitso.com/v3/ticker?book=${book}`
      );

      if (response.data.success && response.data.payload) {
        return parseFloat(response.data.payload.last);
      }

      throw new Error('Failed to fetch market price');
    } catch (error) {
      this.logger.error(`Failed to get market price for ${assetSymbol}/${currency}:`, error);
      throw error;
    }
  }

  async validateOrder(order: ExecutionOrder): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    // Check if asset is supported
    if (
      order.assetSymbol &&
      !this.capabilities.supportedAssets.includes(order.assetSymbol.toUpperCase())
    ) {
      errors.push(`Asset ${order.assetSymbol} is not supported by Bitso`);
    }

    // Check if currency is supported
    if (!this.capabilities.supportedCurrencies.includes(order.currency.toUpperCase())) {
      errors.push(`Currency ${order.currency} is not supported by Bitso`);
    }

    // Check order type support
    if (order.type === OrderType.buy && !this.capabilities.supportsBuy) {
      errors.push('Buy orders not supported by Bitso');
    }
    if (order.type === OrderType.sell && !this.capabilities.supportsSell) {
      errors.push('Sell orders not supported by Bitso');
    }
    if (order.type === OrderType.transfer) {
      errors.push('Transfer orders not supported by Bitso');
    }

    // Check amount limits
    if (this.capabilities.minOrderAmount && order.amount < this.capabilities.minOrderAmount) {
      errors.push(`Order amount below minimum: ${this.capabilities.minOrderAmount}`);
    }
    if (this.capabilities.maxOrderAmount && order.amount > this.capabilities.maxOrderAmount) {
      errors.push(`Order amount exceeds maximum: ${this.capabilities.maxOrderAmount}`);
    }

    // Check limit order support
    if (order.targetPrice && !this.capabilities.supportsLimitOrders) {
      errors.push('Limit orders not supported by Bitso');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get('https://api.bitso.com/v3/ticker?book=btc_mxn', {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      this.logger.error('Bitso health check failed:', error);
      return false;
    }
  }

  /**
   * Helper: Get account credentials from database
   */
  private async getAccountCredentials(
    accountId: string
  ): Promise<{ apiKey: string; apiSecret: string }> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        space: {
          include: {
            userSpaces: {
              take: 1,
              include: {
                user: {
                  include: {
                    providerConnections: {
                      where: { provider: 'bitso' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const connection = (account.space as any).userSpaces[0]?.user?.providerConnections[0];
    if (!connection) {
      throw new Error('Bitso connection not found');
    }

    const apiKey = this.cryptoService.decrypt(JSON.parse(connection.encryptedToken));
    const connectionMetadata = connection.metadata as any;
    const apiSecret = this.cryptoService.decrypt(JSON.parse(connectionMetadata.encryptedApiSecret));

    return { apiKey, apiSecret };
  }

  /**
   * Helper: Create temporary authenticated client
   */
  private createTempClient(apiKey: string, apiSecret: string): AxiosInstance {
    const client = axios.create({
      baseURL: 'https://api.bitso.com/v3',
      timeout: 30000,
    });

    client.interceptors.request.use((config) => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const method = config.method?.toUpperCase() || 'GET';
      const requestPath = config.url || '';
      const body = config.data ? JSON.stringify(config.data) : '';

      const message = timestamp + method + '/v3' + requestPath + body;
      const signature = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');

      config.headers['Authorization'] = `Bitso ${apiKey}:${timestamp}:${signature}`;
      config.headers['Content-Type'] = 'application/json';

      return config;
    });

    return client;
  }
}
