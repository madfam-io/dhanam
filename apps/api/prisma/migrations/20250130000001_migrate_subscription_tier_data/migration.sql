-- Migrate existing subscription tier data to new enum values
-- and set new default. Runs in a separate transaction after enum values are committed.
UPDATE "users" SET "subscription_tier" = 'community' WHERE "subscription_tier" = 'free';
UPDATE "users" SET "subscription_tier" = 'pro' WHERE "subscription_tier" = 'premium';
ALTER TABLE "users" ALTER COLUMN "subscription_tier" SET DEFAULT 'community';
