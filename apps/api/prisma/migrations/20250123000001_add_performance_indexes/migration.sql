-- Add performance indexes for query optimization
-- These indexes support common query patterns identified during performance analysis

-- User table indexes for onboarding and login queries
CREATE INDEX IF NOT EXISTS "users_onboarding_completed_created_at_idx" ON "users"("onboarding_completed", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "users_last_login_at_idx" ON "users"("last_login_at" DESC);

-- Transaction table index for combined account and category filtering
CREATE INDEX IF NOT EXISTS "transactions_account_id_category_id_idx" ON "transactions"("account_id", "category_id");

-- Goal table index for status and update time queries
CREATE INDEX IF NOT EXISTS "goals_status_updated_at_idx" ON "goals"("status", "updated_at" DESC);
