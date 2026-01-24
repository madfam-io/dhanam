import {
  Provider,
  Account as _Account,
  Transaction as _Transaction,
  Currency,
  AccountType,
} from '@db';

/**
 * Base provider interface that all financial data providers must implement
 * Enables multi-provider redundancy and failover
 */
export interface IFinancialProvider {
  /**
   * Provider identifier
   */
  readonly name: Provider;

  /**
   * Check if the provider is healthy and accepting requests
   */
  healthCheck(): Promise<ProviderHealthCheck>;

  /**
   * Create a link token or initiate connection flow
   */
  createLink(params: CreateLinkParams): Promise<LinkResult>;

  /**
   * Exchange temporary token for permanent access token
   */
  exchangeToken(params: ExchangeTokenParams): Promise<ExchangeTokenResult>;

  /**
   * Fetch accounts from the provider
   */
  getAccounts(params: GetAccountsParams): Promise<ProviderAccount[]>;

  /**
   * Sync transactions for an account
   */
  syncTransactions(params: SyncTransactionsParams): Promise<SyncTransactionsResult>;

  /**
   * Handle webhook from the provider
   */
  handleWebhook(payload: any, signature?: string): Promise<WebhookHandlerResult>;

  /**
   * Get institution information by ID
   */
  getInstitution?(institutionId: string): Promise<InstitutionInfo>;

  /**
   * Search institutions by name or keywords
   */
  searchInstitutions?(query: string, region?: string): Promise<InstitutionInfo[]>;
}

// Request/Response Types

export interface ProviderHealthCheck {
  provider: Provider;
  status: 'healthy' | 'degraded' | 'down';
  errorRate: number;
  avgResponseTimeMs: number;
  lastCheckedAt: Date;
  error?: string;
}

export interface CreateLinkParams {
  userId: string;
  spaceId: string;
  region?: string;
  institutionId?: string;
  redirectUri?: string;
  metadata?: any;
}

export interface LinkResult {
  linkToken?: string;
  linkUrl?: string;
  expiresAt: Date;
  expiration?: Date;
  metadata?: any;
}

export interface ExchangeTokenParams {
  publicToken: string;
  userId: string;
  spaceId: string;
  institutionId?: string;
  metadata?: any;
}

export interface ExchangeTokenResult {
  accessToken: string;
  itemId: string;
  institutionId?: string;
  institutionName?: string;
}

export interface GetAccountsParams {
  accessToken: string;
  itemId: string;
  spaceId: string;
  userId?: string;
}

export interface ProviderAccount {
  providerAccountId: string;
  name: string;
  type: AccountType;
  subtype?: string;
  currency: Currency;
  balance: number;
  mask?: string;
  metadata?: any;
}

export interface SyncTransactionsParams {
  accountId: string;
  accessToken: string;
  cursor?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}

export interface SyncTransactionsResult {
  transactions: ProviderTransaction[];
  cursor?: string;
  hasMore: boolean;
  addedCount: number;
  modifiedCount: number;
  removedCount: number;
  added?: number;
  modified?: number;
  removed?: number;
}

export interface ProviderTransaction {
  providerTransactionId: string;
  accountId: string;
  amount: number;
  date: Date;
  description: string;
  merchantName?: string;
  category?: string[];
  pending: boolean;
  metadata?: any;
}

export interface WebhookHandlerResult {
  processed: boolean;
  accountsAffected?: string[];
  action?: 'sync' | 'reconnect' | 'update' | 'ignore';
  error?: string;
}

export interface InstitutionInfo {
  id: string;
  institutionId?: string;
  name: string;
  provider: Provider;
  region: string;
  logo?: string;
  url?: string;
  primaryColor?: string;
  supportedProducts: string[];
}

// Failover and Circuit Breaker Types

export interface ProviderAttemptResult<T = any> {
  success: boolean;
  data?: T;
  error?: ProviderError;
  provider: Provider;
  responseTimeMs: number;
  failoverUsed: boolean;
}

export interface ProviderError {
  code: string;
  message: string;
  type: 'auth' | 'network' | 'rate_limit' | 'provider_down' | 'validation' | 'unknown';
  retryable: boolean;
  provider: Provider;
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  successThreshold: number; // Number of successes before closing circuit
  timeout: number; // Timeout in milliseconds before attempting again
  monitoringWindow: number; // Time window for counting failures (milliseconds)
}

export interface CircuitBreakerState {
  provider: Provider;
  region: string;
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  successes: number;
  lastFailureAt?: Date;
  lastSuccessAt?: Date;
  nextAttemptAt?: Date;
}
