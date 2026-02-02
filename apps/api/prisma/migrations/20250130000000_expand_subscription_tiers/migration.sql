-- Expand SubscriptionTier enum: free → community, premium → pro, add essentials
-- This migration renames existing tiers and adds the new essentials tier.

-- Step 1: Add new enum values
ALTER TYPE "SubscriptionTier" ADD VALUE IF NOT EXISTS 'community';
ALTER TYPE "SubscriptionTier" ADD VALUE IF NOT EXISTS 'essentials';
ALTER TYPE "SubscriptionTier" ADD VALUE IF NOT EXISTS 'pro';

-- Step 2: Migrate existing data
-- Note: PostgreSQL enums can't remove values, so we rename via data migration.
-- After adding new values, update all rows to use the new naming.
UPDATE "users" SET "subscription_tier" = 'community' WHERE "subscription_tier" = 'free';
UPDATE "users" SET "subscription_tier" = 'pro' WHERE "subscription_tier" = 'premium';

-- Step 3: Set default for new users
ALTER TABLE "users" ALTER COLUMN "subscription_tier" SET DEFAULT 'community';
