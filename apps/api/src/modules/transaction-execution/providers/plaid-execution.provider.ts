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
 * Plaid Execution Provider
 * Handles ACH transfers and payments via Plaid
 * NOTE: This is a placeholder implementation - Plaid primarily focuses on
 * read-only financial data aggregation. For actual money movement, you would
 * typically use Plaid + Dwolla or similar payment processor.
 */
@Injectable()
export class PlaidExecutionProvider extends ExecutionProvider {
  private readonly logger = new Logger(PlaidExecutionProvider.name);

  readonly name = 'plaid';
  readonly capabilities: ProviderCapabilities = {
    supportsBuy: false, // Plaid doesn't support direct asset purchases
    supportsSell: false,
    supportsTransfer: true, // ACH transfers between accounts
    supportsDeposit: true, // ACH deposits
    supportsWithdraw: true, // ACH withdrawals
    supportsLimitOrders: false,
    supportsMarketOrders: false,
    minOrderAmount: 1,
    maxOrderAmount: 25000, // Typical ACH limit
    supportedCurrencies: ['USD'],
    supportedAssets: [],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    super();
    this.logger.log('Plaid execution provider initialized');
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
      // TODO: Implement Plaid ACH transfer
      // This would typically involve:
      // 1. Creating a Plaid Transfer via /transfer/create
      // 2. Authorizing the transfer
      // 3. Polling for completion status
      // 4. Handling webhooks for transfer updates

      this.logger.warn('Plaid ACH transfer not yet implemented');

      return {
        success: false,
        errorCode: 'NOT_IMPLEMENTED',
        errorMessage:
          'Plaid ACH transfers require additional implementation with payment processor',
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Plaid transfer failed:', error);
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
      errorCode: 'NOT_IMPLEMENTED',
      errorMessage: 'Plaid deposits require integration with payment processor',
    };
  }

  async executeWithdraw(order: ExecutionOrder): Promise<ExecutionResult> {
    return {
      success: false,
      errorCode: 'NOT_IMPLEMENTED',
      errorMessage: 'Plaid withdrawals require integration with payment processor',
    };
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
    // Plaid health check would verify API connectivity
    // For now, return true as placeholder
    return true;
  }
}
