import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../../core/prisma/prisma.service';

import {
  ExecutionProvider,
  ExecutionOrder,
  ExecutionResult,
  ProviderCapabilities,
} from './execution-provider.interface';

/**
 * Belvo Execution Provider
 * Handles bank transfers in Mexico via Belvo
 * NOTE: Belvo primarily focuses on financial data aggregation.
 * For actual money movement, you would need to integrate with Mexican
 * payment providers like SPEI (Sistema de Pagos Electrónicos Interbancarios)
 */
@Injectable()
export class BelvoExecutionProvider extends ExecutionProvider {
  private readonly logger = new Logger(BelvoExecutionProvider.name);

  readonly name = 'belvo';
  readonly capabilities: ProviderCapabilities = {
    supportsBuy: false, // Belvo doesn't support direct asset purchases
    supportsSell: false,
    supportsTransfer: true, // SPEI transfers between Mexican banks
    supportsDeposit: false,
    supportsWithdraw: false,
    supportsLimitOrders: false,
    supportsMarketOrders: false,
    minOrderAmount: 1,
    maxOrderAmount: 999999, // High limit for SPEI
    supportedCurrencies: ['MXN'],
    supportedAssets: [],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    super();
    this.logger.log('Belvo execution provider initialized');
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
      // TODO: Implement Belvo SPEI transfer
      // This would typically involve:
      // 1. Creating a payment intent via Belvo API
      // 2. Initiating SPEI transfer with Mexican bank
      // 3. Polling for transfer status
      // 4. Handling webhooks for transfer updates

      this.logger.warn('Belvo SPEI transfer not yet implemented');

      return {
        success: false,
        errorCode: 'NOT_IMPLEMENTED',
        errorMessage: 'Belvo SPEI transfers require additional implementation with Mexican banks',
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Belvo transfer failed:', error);
      return {
        success: false,
        errorCode: 'EXECUTION_ERROR',
        errorMessage: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  }

  async executeDeposit(order: ExecutionOrder): Promise<ExecutionResult> {
    return {
      success: false,
      errorCode: 'NOT_SUPPORTED',
      errorMessage: 'Belvo does not support direct deposits',
    };
  }

  async executeWithdraw(order: ExecutionOrder): Promise<ExecutionResult> {
    return {
      success: false,
      errorCode: 'NOT_SUPPORTED',
      errorMessage: 'Belvo does not support direct withdrawals',
    };
  }

  async getMarketPrice(assetSymbol: string, currency: string): Promise<number> {
    throw new Error('Belvo does not provide market prices');
  }

  async validateOrder(order: ExecutionOrder): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (!this.capabilities.supportedCurrencies.includes(order.currency.toUpperCase())) {
      errors.push(`Currency ${order.currency} is not supported by Belvo`);
    }

    if (order.amount < (this.capabilities.minOrderAmount || 0)) {
      errors.push(`Order amount below minimum: ${this.capabilities.minOrderAmount}`);
    }

    if (
      this.capabilities.maxOrderAmount &&
      order.amount > this.capabilities.maxOrderAmount
    ) {
      errors.push(`Order amount exceeds maximum: ${this.capabilities.maxOrderAmount}`);
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async healthCheck(): Promise<boolean> {
    // Belvo health check would verify API connectivity
    // For now, return true as placeholder
    return true;
  }
}
