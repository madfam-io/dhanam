/**
 * Prisma Fallback Type Definitions
 *
 * This file provides stub types for @prisma/client when the Prisma client
 * cannot be generated (e.g., due to network restrictions). These types are
 * based on the schema.prisma file and allow TypeScript to compile without
 * runtime Prisma client generation.
 *
 * WARNING: These are type-only definitions. Runtime functionality requires
 * an actual Prisma client to be generated and available.
 */

declare module '@prisma/client' {
  // ============================================================================
  // ENUMS
  // ============================================================================

  export enum SpaceType {
    personal = 'personal',
    business = 'business',
  }

  export enum SpaceRole {
    owner = 'owner',
    admin = 'admin',
    member = 'member',
    viewer = 'viewer',
  }

  export enum AccountType {
    checking = 'checking',
    savings = 'savings',
    credit = 'credit',
    investment = 'investment',
    crypto = 'crypto',
    other = 'other',
  }

  export enum Provider {
    belvo = 'belvo',
    plaid = 'plaid',
    mx = 'mx',
    finicity = 'finicity',
    bitso = 'bitso',
    blockchain = 'blockchain',
    manual = 'manual',
  }

  export enum ConnectionStatus {
    active = 'active',
    error = 'error',
    syncing = 'syncing',
    disconnected = 'disconnected',
  }

  export enum BudgetPeriod {
    monthly = 'monthly',
    quarterly = 'quarterly',
    yearly = 'yearly',
  }

  export enum Currency {
    MXN = 'MXN',
    USD = 'USD',
    EUR = 'EUR',
  }

  export enum SubscriptionTier {
    free = 'free',
    premium = 'premium',
  }

  export enum BillingEventType {
    subscription_created = 'subscription_created',
    subscription_renewed = 'subscription_renewed',
    subscription_cancelled = 'subscription_cancelled',
    payment_succeeded = 'payment_succeeded',
    payment_failed = 'payment_failed',
    refund_issued = 'refund_issued',
  }

  export enum BillingStatus {
    pending = 'pending',
    succeeded = 'succeeded',
    failed = 'failed',
    refunded = 'refunded',
  }

  export enum UsageMetricType {
    esg_calculation = 'esg_calculation',
    monte_carlo_simulation = 'monte_carlo_simulation',
    goal_probability = 'goal_probability',
    scenario_analysis = 'scenario_analysis',
    portfolio_rebalance = 'portfolio_rebalance',
    api_request = 'api_request',
  }

  export enum ManualAssetType {
    real_estate = 'real_estate',
    vehicle = 'vehicle',
    domain = 'domain',
    private_equity = 'private_equity',
    angel_investment = 'angel_investment',
    collectible = 'collectible',
    art = 'art',
    jewelry = 'jewelry',
    other = 'other',
  }

  export enum AccountOwnership {
    individual = 'individual',
    joint = 'joint',
    trust = 'trust',
  }

  export enum GoalType {
    retirement = 'retirement',
    education = 'education',
    house_purchase = 'house_purchase',
    emergency_fund = 'emergency_fund',
    legacy = 'legacy',
    travel = 'travel',
    business = 'business',
    debt_payoff = 'debt_payoff',
    other = 'other',
  }

  export enum GoalStatus {
    active = 'active',
    paused = 'paused',
    achieved = 'achieved',
    abandoned = 'abandoned',
  }

  export enum GoalShareRole {
    viewer = 'viewer',
    contributor = 'contributor',
    editor = 'editor',
    manager = 'manager',
  }

  export enum GoalShareStatus {
    pending = 'pending',
    accepted = 'accepted',
    declined = 'declined',
    revoked = 'revoked',
  }

  export enum GoalActivityAction {
    created = 'created',
    updated = 'updated',
    shared = 'shared',
    share_accepted = 'share_accepted',
    share_declined = 'share_declined',
    contribution_added = 'contribution_added',
    probability_improved = 'probability_improved',
    probability_declined = 'probability_declined',
    milestone_reached = 'milestone_reached',
    target_date_extended = 'target_date_extended',
    target_amount_adjusted = 'target_amount_adjusted',
    allocation_updated = 'allocation_updated',
    what_if_scenario_run = 'what_if_scenario_run',
    comment_added = 'comment_added',
    achieved = 'achieved',
    paused = 'paused',
    abandoned = 'abandoned',
  }

  export enum HouseholdType {
    family = 'family',
    trust = 'trust',
    estate = 'estate',
    partnership = 'partnership',
  }

  export enum RelationshipType {
    spouse = 'spouse',
    partner = 'partner',
    child = 'child',
    parent = 'parent',
    sibling = 'sibling',
    grandparent = 'grandparent',
    grandchild = 'grandchild',
    dependent = 'dependent',
    trustee = 'trustee',
    beneficiary = 'beneficiary',
    other = 'other',
  }

  export enum SimulationType {
    monte_carlo = 'monte_carlo',
    retirement = 'retirement',
    goal_probability = 'goal_probability',
    safe_withdrawal = 'safe_withdrawal',
    scenario_analysis = 'scenario_analysis',
  }

  export enum WillStatus {
    draft = 'draft',
    active = 'active',
    revoked = 'revoked',
    executed = 'executed',
  }

  export enum AssetType {
    bank_account = 'bank_account',
    investment_account = 'investment_account',
    crypto_account = 'crypto_account',
    real_estate = 'real_estate',
    business_interest = 'business_interest',
    personal_property = 'personal_property',
    other = 'other',
  }

  export enum OrderType {
    buy = 'buy',
    sell = 'sell',
    transfer = 'transfer',
    deposit = 'deposit',
    withdraw = 'withdraw',
  }

  export enum OrderStatus {
    pending_verification = 'pending_verification',
    pending_execution = 'pending_execution',
    pending_trigger = 'pending_trigger',
    executing = 'executing',
    completed = 'completed',
    failed = 'failed',
    cancelled = 'cancelled',
    rejected = 'rejected',
    expired = 'expired',
  }

  export enum AdvancedOrderType {
    stop_loss = 'stop_loss',
    take_profit = 'take_profit',
    trailing_stop = 'trailing_stop',
    oco = 'oco',
  }

  export enum RecurrencePattern {
    once = 'once',
    daily = 'daily',
    weekly = 'weekly',
    monthly = 'monthly',
    quarterly = 'quarterly',
  }

  export enum OrderPriority {
    low = 'low',
    normal = 'normal',
    high = 'high',
    critical = 'critical',
  }

  export enum ExecutionProvider {
    bitso = 'bitso',
    plaid = 'plaid',
    belvo = 'belvo',
    manual = 'manual',
  }

  // ============================================================================
  // MODELS
  // ============================================================================

  export class Decimal {
    constructor(value: string | number);
    toNumber(): number;
    toString(): string;
    toFixed(decimals?: number): string;
    add(other: Decimal | number | string): Decimal;
    sub(other: Decimal | number | string): Decimal;
    mul(other: Decimal | number | string): Decimal;
    div(other: Decimal | number | string): Decimal;
  }

  export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
  export type JsonObject = { [Key in string]?: JsonValue };
  export type JsonArray = JsonValue[];

  export interface User {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    dateOfBirth: Date | null;
    locale: string;
    timezone: string;
    totpSecret: string | null;
    totpTempSecret: string | null;
    totpEnabled: boolean;
    totpBackupCodes: string[];
    emailVerified: boolean;
    isActive: boolean;
    isAdmin: boolean;
    onboardingCompleted: boolean;
    onboardingCompletedAt: Date | null;
    onboardingStep: string | null;
    lastLoginAt: Date | null;
    subscriptionTier: SubscriptionTier;
    subscriptionStartedAt: Date | null;
    subscriptionExpiresAt: Date | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface UserPreferences {
    id: string;
    userId: string;
    emailNotifications: boolean;
    transactionAlerts: boolean;
    budgetAlerts: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
    securityAlerts: boolean;
    promotionalEmails: boolean;
    pushNotifications: boolean;
    transactionPush: boolean;
    budgetPush: boolean;
    securityPush: boolean;
    dataSharing: boolean;
    analyticsTracking: boolean;
    personalizedAds: boolean;
    dashboardLayout: string;
    chartType: string;
    themeMode: string;
    compactView: boolean;
    showBalances: boolean;
    defaultCurrency: Currency;
    hideSensitiveData: boolean;
    autoCategorizeTxns: boolean;
    includeWeekends: boolean;
    esgScoreVisibility: boolean;
    sustainabilityAlerts: boolean;
    impactReporting: boolean;
    autoBackup: boolean;
    backupFrequency: string | null;
    exportFormat: string;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface Session {
    id: string;
    userId: string;
    tokenFamily: string;
    refreshTokenHash: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface ProviderConnection {
    id: string;
    userId: string;
    provider: Provider;
    providerUserId: string;
    encryptedToken: string;
    metadata: JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface Space {
    id: string;
    name: string;
    type: SpaceType;
    currency: Currency;
    timezone: string;
    householdId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface UserSpace {
    userId: string;
    spaceId: string;
    role: SpaceRole;
    createdAt: Date;
  }

  export interface Account {
    id: string;
    spaceId: string;
    provider: Provider;
    providerAccountId: string | null;
    name: string;
    type: AccountType;
    subtype: string | null;
    currency: Currency;
    balance: Decimal;
    ownership: AccountOwnership;
    ownerId: string | null;
    encryptedCredentials: JsonValue | null;
    metadata: JsonValue | null;
    lastSyncedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface Connection {
    id: string;
    accountId: string;
    status: ConnectionStatus;
    error: string | null;
    metadata: JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface Transaction {
    id: string;
    accountId: string;
    providerTransactionId: string | null;
    amount: Decimal;
    currency: Currency;
    description: string;
    merchant: string | null;
    categoryId: string | null;
    date: Date;
    pending: boolean;
    isSplit: boolean;
    metadata: JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface Category {
    id: string;
    budgetId: string;
    name: string;
    budgetedAmount: Decimal;
    carryoverAmount: Decimal;
    icon: string | null;
    color: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface TransactionRule {
    id: string;
    spaceId: string;
    name: string;
    conditions: JsonValue;
    categoryId: string | null;
    priority: number;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface Budget {
    id: string;
    spaceId: string;
    name: string;
    period: BudgetPeriod;
    startDate: Date;
    endDate: Date | null;
    income: Decimal;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface AssetValuation {
    id: string;
    accountId: string;
    date: Date;
    value: Decimal;
    currency: Currency;
    createdAt: Date;
  }

  export interface ESGScore {
    id: string;
    accountId: string;
    assetSymbol: string;
    environmentalScore: Decimal | null;
    socialScore: Decimal | null;
    governanceScore: Decimal | null;
    compositeScore: Decimal | null;
    calculatedAt: Date;
    metadata: JsonValue | null;
    createdAt: Date;
  }

  export interface ManualAsset {
    id: string;
    spaceId: string;
    name: string;
    type: ManualAssetType;
    description: string | null;
    currentValue: Decimal;
    currency: Currency;
    acquisitionDate: Date | null;
    acquisitionCost: Decimal | null;
    metadata: JsonValue | null;
    documents: JsonValue | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface ManualAssetValuation {
    id: string;
    assetId: string;
    date: Date;
    value: Decimal;
    currency: Currency;
    source: string | null;
    notes: string | null;
    createdAt: Date;
  }

  export interface AuditLog {
    id: string;
    userId: string | null;
    action: string;
    resource: string | null;
    resourceId: string | null;
    metadata: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    severity: string;
    timestamp: Date;
    createdAt: Date;
  }

  export interface WebhookEvent {
    id: string;
    provider: Provider;
    eventType: string;
    payload: JsonValue;
    signature: string;
    processed: boolean;
    error: string | null;
    createdAt: Date;
    processedAt: Date | null;
  }

  export interface ErrorLog {
    id: string;
    timestamp: Date;
    level: string;
    message: string;
    stack: string | null;
    context: JsonValue | null;
    metadata: JsonValue | null;
    createdAt: Date;
  }

  export interface ExchangeRate {
    id: string;
    fromCurrency: Currency;
    toCurrency: Currency;
    rate: number;
    date: Date;
    source: string;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface BillingEvent {
    id: string;
    userId: string;
    type: BillingEventType;
    amount: Decimal;
    currency: Currency;
    status: BillingStatus;
    stripeEventId: string | null;
    metadata: JsonValue | null;
    createdAt: Date;
  }

  export interface UsageMetric {
    id: string;
    userId: string;
    metricType: UsageMetricType;
    count: number;
    date: Date;
    metadata: JsonValue | null;
  }

  export interface Goal {
    id: string;
    spaceId: string;
    householdId: string | null;
    name: string;
    description: string | null;
    type: GoalType;
    targetAmount: Decimal;
    currency: Currency;
    targetDate: Date;
    priority: number;
    status: GoalStatus;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    currentProbability: Decimal | null;
    confidenceLow: Decimal | null;
    confidenceHigh: Decimal | null;
    lastSimulationAt: Date | null;
    probabilityHistory: JsonValue | null;
    currentProgress: Decimal | null;
    projectedCompletion: Date | null;
    expectedReturn: Decimal | null;
    volatility: Decimal | null;
    monthlyContribution: Decimal | null;
    createdBy: string | null;
    isShared: boolean;
    sharedWithMessage: string | null;
  }

  export interface GoalAllocation {
    id: string;
    goalId: string;
    accountId: string;
    percentage: Decimal;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface GoalShare {
    id: string;
    goalId: string;
    sharedWith: string;
    role: GoalShareRole;
    invitedBy: string;
    status: GoalShareStatus;
    message: string | null;
    acceptedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface GoalActivity {
    id: string;
    goalId: string;
    userId: string;
    action: GoalActivityAction;
    metadata: JsonValue | null;
    createdAt: Date;
  }

  export interface Simulation {
    id: string;
    userId: string;
    spaceId: string | null;
    goalId: string | null;
    type: SimulationType;
    config: JsonValue;
    result: JsonValue | null;
    status: string;
    errorMessage: string | null;
    executionTimeMs: number | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface Household {
    id: string;
    name: string;
    type: HouseholdType;
    baseCurrency: Currency;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface HouseholdMember {
    id: string;
    householdId: string;
    userId: string;
    relationship: RelationshipType;
    isMinor: boolean;
    accessStartDate: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface Will {
    id: string;
    householdId: string;
    name: string;
    status: WillStatus;
    lastReviewedAt: Date | null;
    activatedAt: Date | null;
    revokedAt: Date | null;
    executedAt: Date | null;
    notes: string | null;
    legalDisclaimer: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface BeneficiaryDesignation {
    id: string;
    willId: string;
    beneficiaryId: string;
    assetType: AssetType;
    assetId: string | null;
    percentage: Decimal;
    conditions: JsonValue | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface WillExecutor {
    id: string;
    willId: string;
    executorId: string;
    isPrimary: boolean;
    order: number;
    acceptedAt: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface TransactionOrder {
    id: string;
    spaceId: string;
    userId: string;
    accountId: string;
    idempotencyKey: string;
    type: OrderType;
    status: OrderStatus;
    priority: OrderPriority;
    amount: Decimal;
    currency: Currency;
    assetSymbol: string | null;
    targetPrice: Decimal | null;
    toAccountId: string | null;
    provider: ExecutionProvider;
    dryRun: boolean;
    maxSlippage: Decimal | null;
    advancedType: AdvancedOrderType | null;
    stopPrice: Decimal | null;
    takeProfitPrice: Decimal | null;
    trailingAmount: Decimal | null;
    trailingPercent: Decimal | null;
    linkedOrderId: string | null;
    highestPrice: Decimal | null;
    lastPriceCheck: Date | null;
    scheduledFor: Date | null;
    recurrence: RecurrencePattern | null;
    recurrenceDay: number | null;
    recurrenceEnd: Date | null;
    nextExecutionAt: Date | null;
    executionCount: number;
    maxExecutions: number | null;
    otpVerified: boolean;
    otpVerifiedAt: Date | null;
    ipAddress: string | null;
    userAgent: string | null;
    goalId: string | null;
    autoExecute: boolean;
    executedAmount: Decimal | null;
    executedPrice: Decimal | null;
    fees: Decimal | null;
    feeCurrency: Currency | null;
    providerOrderId: string | null;
    providerResponse: JsonValue | null;
    notes: string | null;
    metadata: JsonValue | null;
    submittedAt: Date;
    verifiedAt: Date | null;
    executedAt: Date | null;
    completedAt: Date | null;
    cancelledAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface OrderExecution {
    id: string;
    orderId: string;
    attemptNumber: number;
    status: OrderStatus;
    provider: ExecutionProvider;
    providerOrderId: string | null;
    executedAmount: Decimal | null;
    executedPrice: Decimal | null;
    fees: Decimal | null;
    feeCurrency: Currency | null;
    errorCode: string | null;
    errorMessage: string | null;
    providerRequest: JsonValue | null;
    providerResponse: JsonValue | null;
    startedAt: Date;
    completedAt: Date | null;
    duration: number | null;
    createdAt: Date;
  }

  export interface IdempotencyKey {
    id: string;
    key: string;
    userId: string;
    spaceId: string;
    requestHash: string;
    orderId: string | null;
    responseStatus: number | null;
    responseBody: JsonValue | null;
    expiresAt: Date;
    createdAt: Date;
  }

  export interface OrderLimit {
    id: string;
    userId: string;
    spaceId: string | null;
    limitType: string;
    orderType: OrderType | null;
    maxAmount: Decimal;
    currency: Currency;
    usedAmount: Decimal;
    resetAt: Date;
    notes: string | null;
    enforced: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface InstitutionProviderMapping {
    id: string;
    institutionId: string;
    institutionName: string;
    primaryProvider: Provider;
    backupProviders: JsonValue;
    region: string;
    providerMetadata: JsonValue | null;
    lastHealthCheck: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface ProviderHealthStatus {
    id: string;
    provider: Provider;
    region: string;
    status: string;
    errorRate: Decimal;
    avgResponseTimeMs: number;
    successfulCalls: number;
    failedCalls: number;
    lastSuccessAt: Date | null;
    lastFailureAt: Date | null;
    lastError: string | null;
    circuitBreakerOpen: boolean;
    windowStartAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface ConnectionAttempt {
    id: string;
    accountId: string | null;
    spaceId: string;
    provider: Provider;
    institutionId: string | null;
    attemptType: string;
    status: string;
    errorCode: string | null;
    errorMessage: string | null;
    responseTimeMs: number | null;
    failoverUsed: boolean;
    failoverProvider: Provider | null;
    metadata: JsonValue | null;
    attemptedAt: Date;
  }

  export interface TransactionSplit {
    id: string;
    transactionId: string;
    userId: string;
    amount: Decimal;
    percentage: Decimal | null;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface AccountSharingPermission {
    id: string;
    accountId: string;
    sharedWithId: string;
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }

  // ============================================================================
  // PRISMA NAMESPACE - WHERE/ORDER BY/INPUT TYPES
  // ============================================================================

  export namespace Prisma {
    // Common filter operators
    export type StringFilter = {
      equals?: string;
      in?: string[];
      notIn?: string[];
      lt?: string;
      lte?: string;
      gt?: string;
      gte?: string;
      contains?: string;
      startsWith?: string;
      endsWith?: string;
      mode?: 'default' | 'insensitive';
      not?: string | StringFilter;
    };

    export type IntFilter = {
      equals?: number;
      in?: number[];
      notIn?: number[];
      lt?: number;
      lte?: number;
      gt?: number;
      gte?: number;
      not?: number | IntFilter;
    };

    export type DecimalFilter = {
      equals?: Decimal | number | string;
      in?: (Decimal | number | string)[];
      notIn?: (Decimal | number | string)[];
      lt?: Decimal | number | string;
      lte?: Decimal | number | string;
      gt?: Decimal | number | string;
      gte?: Decimal | number | string;
      not?: Decimal | number | string | DecimalFilter;
    };

    export type DateTimeFilter = {
      equals?: Date | string;
      in?: (Date | string)[];
      notIn?: (Date | string)[];
      lt?: Date | string;
      lte?: Date | string;
      gt?: Date | string;
      gte?: Date | string;
      not?: Date | string | DateTimeFilter;
    };

    export type BoolFilter = {
      equals?: boolean;
      not?: boolean | BoolFilter;
    };

    export type EnumProviderFilter = {
      equals?: Provider;
      in?: Provider[];
      notIn?: Provider[];
      not?: Provider | EnumProviderFilter;
    };

    export type EnumCurrencyFilter = {
      equals?: Currency;
      in?: Currency[];
      notIn?: Currency[];
      not?: Currency | EnumCurrencyFilter;
    };

    export type JsonFilter = {
      equals?: JsonValue;
      not?: JsonValue;
    };

    // Transaction-specific types
    export type TransactionWhereInput = {
      AND?: TransactionWhereInput[];
      OR?: TransactionWhereInput[];
      NOT?: TransactionWhereInput[];
      id?: StringFilter | string;
      accountId?: StringFilter | string;
      providerTransactionId?: StringFilter | string | null;
      amount?: DecimalFilter | Decimal | number | string;
      currency?: EnumCurrencyFilter | Currency;
      description?: StringFilter | string;
      merchant?: StringFilter | string | null;
      categoryId?: StringFilter | string | null;
      date?: DateTimeFilter | Date | string;
      pending?: BoolFilter | boolean;
      isSplit?: BoolFilter | boolean;
      metadata?: JsonFilter | null;
      createdAt?: DateTimeFilter | Date | string;
      updatedAt?: DateTimeFilter | Date | string;
      account?: AccountWhereInput;
      category?: CategoryWhereInput;
      splits?: TransactionSplitListRelationFilter;
    };

    export type SortOrder = 'asc' | 'desc';

    export type TransactionOrderByWithRelationInput = {
      id?: SortOrder;
      accountId?: SortOrder;
      providerTransactionId?: SortOrder;
      amount?: SortOrder;
      currency?: SortOrder;
      description?: SortOrder;
      merchant?: SortOrder;
      categoryId?: SortOrder;
      date?: SortOrder;
      pending?: SortOrder;
      isSplit?: SortOrder;
      createdAt?: SortOrder;
      updatedAt?: SortOrder;
      account?: AccountOrderByWithRelationInput;
      category?: CategoryOrderByWithRelationInput;
    };

    // Account-specific types
    export type AccountWhereInput = {
      AND?: AccountWhereInput[];
      OR?: AccountWhereInput[];
      NOT?: AccountWhereInput[];
      id?: StringFilter | string;
      spaceId?: StringFilter | string;
      provider?: EnumProviderFilter | Provider;
      providerAccountId?: StringFilter | string | null;
      name?: StringFilter | string;
      type?: StringFilter | string;
      subtype?: StringFilter | string | null;
      currency?: EnumCurrencyFilter | Currency;
      balance?: DecimalFilter | Decimal | number | string;
      ownership?: StringFilter | string;
      ownerId?: StringFilter | string | null;
      encryptedCredentials?: JsonFilter | null;
      metadata?: JsonFilter | null;
      lastSyncedAt?: DateTimeFilter | Date | string | null;
      createdAt?: DateTimeFilter | Date | string;
      updatedAt?: DateTimeFilter | Date | string;
      space?: SpaceWhereInput;
      transactions?: TransactionListRelationFilter;
    };

    export type AccountOrderByWithRelationInput = {
      id?: SortOrder;
      spaceId?: SortOrder;
      provider?: SortOrder;
      name?: SortOrder;
      type?: SortOrder;
      currency?: SortOrder;
      balance?: SortOrder;
      ownership?: SortOrder;
      createdAt?: SortOrder;
      updatedAt?: SortOrder;
    };

    // Category-specific types
    export type CategoryWhereInput = {
      AND?: CategoryWhereInput[];
      OR?: CategoryWhereInput[];
      NOT?: CategoryWhereInput[];
      id?: StringFilter | string;
      budgetId?: StringFilter | string;
      name?: StringFilter | string;
      budgetedAmount?: DecimalFilter | Decimal | number | string;
      carryoverAmount?: DecimalFilter | Decimal | number | string;
      icon?: StringFilter | string | null;
      color?: StringFilter | string | null;
      description?: StringFilter | string | null;
      createdAt?: DateTimeFilter | Date | string;
      updatedAt?: DateTimeFilter | Date | string;
      budget?: BudgetWhereInput;
      transactions?: TransactionListRelationFilter;
    };

    export type CategoryOrderByWithRelationInput = {
      id?: SortOrder;
      budgetId?: SortOrder;
      name?: SortOrder;
      budgetedAmount?: SortOrder;
      carryoverAmount?: SortOrder;
      createdAt?: SortOrder;
      updatedAt?: SortOrder;
    };

    // Goal-specific types
    export type GoalWhereInput = {
      AND?: GoalWhereInput[];
      OR?: GoalWhereInput[];
      NOT?: GoalWhereInput[];
      id?: StringFilter | string;
      spaceId?: StringFilter | string;
      householdId?: StringFilter | string | null;
      name?: StringFilter | string;
      description?: StringFilter | string | null;
      type?: StringFilter | string;
      targetAmount?: DecimalFilter | Decimal | number | string;
      currency?: EnumCurrencyFilter | Currency;
      targetDate?: DateTimeFilter | Date | string;
      priority?: IntFilter | number;
      status?: StringFilter | string;
      notes?: StringFilter | string | null;
      createdAt?: DateTimeFilter | Date | string;
      updatedAt?: DateTimeFilter | Date | string;
      space?: SpaceWhereInput;
      household?: HouseholdWhereInput;
    };

    export type GoalOrderByWithRelationInput = {
      id?: SortOrder;
      spaceId?: SortOrder;
      name?: SortOrder;
      type?: SortOrder;
      targetAmount?: SortOrder;
      targetDate?: SortOrder;
      priority?: SortOrder;
      status?: SortOrder;
      createdAt?: SortOrder;
      updatedAt?: SortOrder;
    };

    // Space-specific types
    export type SpaceWhereInput = {
      AND?: SpaceWhereInput[];
      OR?: SpaceWhereInput[];
      NOT?: SpaceWhereInput[];
      id?: StringFilter | string;
      name?: StringFilter | string;
      type?: StringFilter | string;
      currency?: EnumCurrencyFilter | Currency;
      timezone?: StringFilter | string;
      householdId?: StringFilter | string | null;
      createdAt?: DateTimeFilter | Date | string;
      updatedAt?: DateTimeFilter | Date | string;
    };

    // Budget-specific types
    export type BudgetWhereInput = {
      AND?: BudgetWhereInput[];
      OR?: BudgetWhereInput[];
      NOT?: BudgetWhereInput[];
      id?: StringFilter | string;
      spaceId?: StringFilter | string;
      name?: StringFilter | string;
      period?: StringFilter | string;
      startDate?: DateTimeFilter | Date | string;
      endDate?: DateTimeFilter | Date | string | null;
      income?: DecimalFilter | Decimal | number | string;
      createdAt?: DateTimeFilter | Date | string;
      updatedAt?: DateTimeFilter | Date | string;
    };

    // Household-specific types
    export type HouseholdWhereInput = {
      AND?: HouseholdWhereInput[];
      OR?: HouseholdWhereInput[];
      NOT?: HouseholdWhereInput[];
      id?: StringFilter | string;
      name?: StringFilter | string;
      type?: StringFilter | string;
      baseCurrency?: EnumCurrencyFilter | Currency;
      description?: StringFilter | string | null;
      createdAt?: DateTimeFilter | Date | string;
      updatedAt?: DateTimeFilter | Date | string;
    };

    // User-specific types
    export type UserWhereInput = {
      AND?: UserWhereInput[];
      OR?: UserWhereInput[];
      NOT?: UserWhereInput[];
      id?: StringFilter | string;
      email?: StringFilter | string;
      name?: StringFilter | string;
      locale?: StringFilter | string;
      timezone?: StringFilter | string;
      totpEnabled?: BoolFilter | boolean;
      emailVerified?: BoolFilter | boolean;
      isActive?: BoolFilter | boolean;
      isAdmin?: BoolFilter | boolean;
      onboardingCompleted?: BoolFilter | boolean;
      subscriptionTier?: StringFilter | string;
      createdAt?: DateTimeFilter | Date | string;
      updatedAt?: DateTimeFilter | Date | string;
    };

    export type UserOrderByWithRelationInput = {
      id?: SortOrder;
      email?: SortOrder;
      name?: SortOrder;
      createdAt?: SortOrder;
      updatedAt?: SortOrder;
    };

    // List relation filters
    export type TransactionListRelationFilter = {
      every?: TransactionWhereInput;
      some?: TransactionWhereInput;
      none?: TransactionWhereInput;
    };

    export type TransactionSplitListRelationFilter = {
      every?: TransactionSplitWhereInput;
      some?: TransactionSplitWhereInput;
      none?: TransactionSplitWhereInput;
    };

    export type TransactionSplitWhereInput = {
      AND?: TransactionSplitWhereInput[];
      OR?: TransactionSplitWhereInput[];
      NOT?: TransactionSplitWhereInput[];
      id?: StringFilter | string;
      transactionId?: StringFilter | string;
      userId?: StringFilter | string;
      amount?: DecimalFilter | Decimal | number | string;
      percentage?: DecimalFilter | Decimal | number | string | null;
      note?: StringFilter | string | null;
      createdAt?: DateTimeFilter | Date | string;
      updatedAt?: DateTimeFilter | Date | string;
    };

    // AuditLog-specific types
    export type AuditLogWhereInput = {
      AND?: AuditLogWhereInput[];
      OR?: AuditLogWhereInput[];
      NOT?: AuditLogWhereInput[];
      id?: StringFilter | string;
      userId?: StringFilter | string | null;
      action?: StringFilter | string;
      resource?: StringFilter | string | null;
      resourceId?: StringFilter | string | null;
      metadata?: StringFilter | string | null;
      ipAddress?: StringFilter | string | null;
      userAgent?: StringFilter | string | null;
      severity?: StringFilter | string;
      timestamp?: DateTimeFilter | Date | string;
      createdAt?: DateTimeFilter | Date | string;
    };

    export type AuditLogOrderByWithRelationInput = {
      id?: SortOrder;
      userId?: SortOrder;
      action?: SortOrder;
      resource?: SortOrder;
      resourceId?: SortOrder;
      severity?: SortOrder;
      timestamp?: SortOrder;
      createdAt?: SortOrder;
    };

    // GetPayload types for advanced usage
    export type GoalGetPayload<T extends { include?: any; select?: any }> = Goal & {
      allocations?: T['include'] extends { allocations: true } ? GoalAllocation[] : never;
    };

    export type WillGetPayload<T extends { include?: any; select?: any }> = Will & {
      beneficiaries?: T['include'] extends { beneficiaries: true }
        ? BeneficiaryDesignation[]
        : never;
      executors?: T['include'] extends { executors: true } ? WillExecutor[] : never;
    };
  }

  // ============================================================================
  // PRISMA CLIENT
  // ============================================================================

  export class PrismaClient {
    constructor(options?: any);

    user: any;
    userPreferences: any;
    session: any;
    providerConnection: any;
    space: any;
    userSpace: any;
    account: any;
    connection: any;
    transaction: any;
    category: any;
    transactionRule: any;
    budget: any;
    assetValuation: any;
    esgScore: any;
    manualAsset: any;
    manualAssetValuation: any;
    auditLog: any;
    webhookEvent: any;
    errorLog: any;
    exchangeRate: any;
    billingEvent: any;
    usageMetric: any;
    goal: any;
    goalAllocation: any;
    goalShare: any;
    goalActivity: any;
    simulation: any;
    household: any;
    householdMember: any;
    will: any;
    beneficiaryDesignation: any;
    willExecutor: any;
    transactionOrder: any;
    orderExecution: any;
    idempotencyKey: any;
    orderLimit: any;
    institutionProviderMapping: any;
    providerHealthStatus: any;
    connectionAttempt: any;
    transactionSplit: any;
    accountSharingPermission: any;

    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    $on(eventType: string, callback: Function): void;
    $transaction(fn: any): Promise<any>;
    $queryRaw(query: TemplateStringsArray | string, ...values: any[]): Promise<any>;
    $executeRaw(query: TemplateStringsArray | string, ...values: any[]): Promise<number>;
  }

  // ============================================================================
  // PRISMA ERRORS
  // ============================================================================

  export class PrismaClientKnownRequestError extends Error {
    code: string;
    meta?: Record<string, any>;
    clientVersion: string;

    constructor(
      message: string,
      options: { code: string; clientVersion: string; meta?: Record<string, any> }
    );
  }

  export class PrismaClientUnknownRequestError extends Error {
    clientVersion: string;

    constructor(message: string, options: { clientVersion: string });
  }

  export class PrismaClientRustPanicError extends Error {
    clientVersion: string;

    constructor(message: string, options: { clientVersion: string });
  }

  export class PrismaClientInitializationError extends Error {
    clientVersion: string;
    errorCode?: string;

    constructor(message: string, options: { clientVersion: string; errorCode?: string });
  }

  export class PrismaClientValidationError extends Error {
    constructor(message: string);
  }
}

// Re-export runtime types
declare module '@prisma/client/runtime/library' {
  export type InputJsonValue = null | string | number | boolean | InputJsonObject | InputJsonArray;

  export type InputJsonObject = {
    readonly [Key in string]?: InputJsonValue;
  };

  export type InputJsonArray = ReadonlyArray<InputJsonValue>;

  export class Decimal {
    constructor(value: string | number);
    toNumber(): number;
    toString(): string;
    toFixed(decimals?: number): string;
    add(other: Decimal | number | string): Decimal;
    sub(other: Decimal | number | string): Decimal;
    mul(other: Decimal | number | string): Decimal;
    div(other: Decimal | number | string): Decimal;
  }

  export class PrismaClientKnownRequestError extends Error {
    code: string;
    meta?: Record<string, any>;
    clientVersion: string;

    constructor(
      message: string,
      options: { code: string; clientVersion: string; meta?: Record<string, any> }
    );
  }

  export class PrismaClientUnknownRequestError extends Error {
    clientVersion: string;

    constructor(message: string, options: { clientVersion: string });
  }

  export class PrismaClientRustPanicError extends Error {
    clientVersion: string;

    constructor(message: string, options: { clientVersion: string });
  }

  export class PrismaClientInitializationError extends Error {
    clientVersion: string;
    errorCode?: string;

    constructor(message: string, options: { clientVersion: string; errorCode?: string });
  }

  export class PrismaClientValidationError extends Error {
    constructor(message: string);
  }
}
