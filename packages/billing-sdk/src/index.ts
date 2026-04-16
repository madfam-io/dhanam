// Client
export { DhanamClient } from './client';

// Usage metering client
export { DhanamUsageClient } from './usage';
export type { UsageClientConfig } from './usage';

// Referral clients
export { DhanamReferralClient } from './referral';
export type { ReferralClientConfig } from './referral';
export { DhanamReferralReporter } from './referral-reporter';
export type { ReferralReporterConfig } from './referral-reporter';

// Errors
export { DhanamApiError, DhanamAuthError } from './errors';

// Webhook utilities
export { parseWebhookPayload, verifyWebhookSignature } from './webhook';

// Types (re-export everything)
export type {
  AmbassadorProfile,
  ApplyResult,
  BillingEvent,
  BillingHistory,
  BillingProvider,
  CheckoutOptions,
  CheckoutResult,
  CreditBalance,
  CreditUsageResult,
  DhanamClientConfig,
  DhanamWebhookData,
  DhanamWebhookPayload,
  GenerateCodeOptions,
  PlanSlug,
  PortalResult,
  ReferralCode,
  ReferralCodeInfo,
  ReferralEvent,
  ReferralLandingData,
  ReferralReward,
  ReferralStats,
  ServiceBreakdown,
  SubscriptionStatus,
  SubscriptionTier,
  UpgradeOptions,
  UsageBreakdown,
  UsageBucket,
  UsageEventEntry,
  UsageMetricType,
  UsageMetrics,
  UTMParams,
} from './types';

// Enum (value export — consumers need runtime access)
export { DhanamWebhookEventType } from './types';
