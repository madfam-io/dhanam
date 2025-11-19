/**
 * Execution Provider Interface
 * Abstract interface for all execution providers (Bitso, Plaid, Belvo, etc.)
 */

export enum OrderType {
  buy = 'buy',
  sell = 'sell',
  transfer = 'transfer',
  deposit = 'deposit',
  withdraw = 'withdraw',
}

export interface ExecutionOrder {
  id: string;
  type: OrderType;
  amount: number;
  currency: string;
  assetSymbol?: string;
  targetPrice?: number;
  maxSlippage?: number;
  accountId: string;
  toAccountId?: string;
  metadata?: any;
}

export interface ExecutionResult {
  success: boolean;
  providerOrderId?: string;
  executedAmount?: number;
  executedPrice?: number;
  fees?: number;
  feeCurrency?: string;
  errorCode?: string;
  errorMessage?: string;
  rawResponse?: any;
  executionTime?: number; // milliseconds
}

export interface ProviderCapabilities {
  supportsBuy: boolean;
  supportsSell: boolean;
  supportsTransfer: boolean;
  supportsDeposit: boolean;
  supportsWithdraw: boolean;
  supportsLimitOrders: boolean;
  supportsMarketOrders: boolean;
  minOrderAmount?: number;
  maxOrderAmount?: number;
  supportedCurrencies: string[];
  supportedAssets: string[];
}

export abstract class ExecutionProvider {
  abstract readonly name: string;
  abstract readonly capabilities: ProviderCapabilities;

  /**
   * Execute a buy order
   */
  abstract executeBuy(order: ExecutionOrder): Promise<ExecutionResult>;

  /**
   * Execute a sell order
   */
  abstract executeSell(order: ExecutionOrder): Promise<ExecutionResult>;

  /**
   * Execute a transfer between accounts
   */
  abstract executeTransfer(order: ExecutionOrder): Promise<ExecutionResult>;

  /**
   * Execute a deposit from external source
   */
  abstract executeDeposit(order: ExecutionOrder): Promise<ExecutionResult>;

  /**
   * Execute a withdrawal to external destination
   */
  abstract executeWithdraw(order: ExecutionOrder): Promise<ExecutionResult>;

  /**
   * Get current market price for an asset
   */
  abstract getMarketPrice(assetSymbol: string, currency: string): Promise<number>;

  /**
   * Validate order before execution
   */
  abstract validateOrder(order: ExecutionOrder): Promise<{ valid: boolean; errors?: string[] }>;

  /**
   * Check if provider is available and healthy
   */
  abstract healthCheck(): Promise<boolean>;
}
