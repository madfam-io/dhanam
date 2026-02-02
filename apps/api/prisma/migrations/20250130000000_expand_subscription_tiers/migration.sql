-- Expand SubscriptionTier enum: add new values
-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction,
-- so this migration ONLY adds enum values. Data migration is in the next migration.
ALTER TYPE "SubscriptionTier" ADD VALUE IF NOT EXISTS 'community';
ALTER TYPE "SubscriptionTier" ADD VALUE IF NOT EXISTS 'essentials';
ALTER TYPE "SubscriptionTier" ADD VALUE IF NOT EXISTS 'pro';
