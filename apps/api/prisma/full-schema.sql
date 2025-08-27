-- Full Dhanam Database Schema (converted from Prisma)
-- Run this to bypass Prisma permission bug

\c dhanam;

-- Drop existing test table
DROP TABLE IF EXISTS test_permissions;

-- Enums
CREATE TYPE "SpaceType" AS ENUM ('personal', 'business');
CREATE TYPE "SpaceRole" AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE "AccountType" AS ENUM ('checking', 'savings', 'credit', 'investment', 'crypto', 'other');
CREATE TYPE "Provider" AS ENUM ('belvo', 'plaid', 'bitso', 'manual');
CREATE TYPE "ConnectionStatus" AS ENUM ('active', 'error', 'syncing', 'disconnected');
CREATE TYPE "BudgetPeriod" AS ENUM ('monthly', 'quarterly', 'yearly');
CREATE TYPE "Currency" AS ENUM ('MXN', 'USD', 'EUR');

-- Users table
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'es',
    "timezone" TEXT NOT NULL DEFAULT 'America/Mexico_City',
    "totp_secret" TEXT,
    "totp_temp_secret" TEXT,
    "totp_enabled" BOOLEAN NOT NULL DEFAULT false,
    "totp_backup_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_completed_at" TIMESTAMPTZ,
    "onboarding_step" TEXT,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- User Preferences table
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "transaction_alerts" BOOLEAN NOT NULL DEFAULT true,
    "budget_alerts" BOOLEAN NOT NULL DEFAULT true,
    "weekly_reports" BOOLEAN NOT NULL DEFAULT true,
    "monthly_reports" BOOLEAN NOT NULL DEFAULT true,
    "security_alerts" BOOLEAN NOT NULL DEFAULT true,
    "promotional_emails" BOOLEAN NOT NULL DEFAULT false,
    "push_notifications" BOOLEAN NOT NULL DEFAULT true,
    "transaction_push" BOOLEAN NOT NULL DEFAULT true,
    "budget_push" BOOLEAN NOT NULL DEFAULT true,
    "security_push" BOOLEAN NOT NULL DEFAULT true,
    "data_sharing" BOOLEAN NOT NULL DEFAULT false,
    "analytics_tracking" BOOLEAN NOT NULL DEFAULT true,
    "personalized_ads" BOOLEAN NOT NULL DEFAULT false,
    "dashboard_layout" TEXT NOT NULL DEFAULT 'standard',
    "chart_type" TEXT NOT NULL DEFAULT 'line',
    "theme_mode" TEXT NOT NULL DEFAULT 'light',
    "compact_view" BOOLEAN NOT NULL DEFAULT false,
    "show_balances" BOOLEAN NOT NULL DEFAULT true,
    "default_currency" "Currency" NOT NULL DEFAULT 'MXN',
    "hide_sensitive_data" BOOLEAN NOT NULL DEFAULT false,
    "auto_categorize_txns" BOOLEAN NOT NULL DEFAULT true,
    "include_weekends" BOOLEAN NOT NULL DEFAULT true,
    "esg_score_visibility" BOOLEAN NOT NULL DEFAULT true,
    "sustainability_alerts" BOOLEAN NOT NULL DEFAULT false,
    "impact_reporting" BOOLEAN NOT NULL DEFAULT false,
    "auto_backup" BOOLEAN NOT NULL DEFAULT false,
    "backup_frequency" TEXT,
    "export_format" TEXT NOT NULL DEFAULT 'csv',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_preferences_user_id_key" UNIQUE ("user_id")
);

-- Sessions table
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- Spaces table
CREATE TABLE "spaces" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "type" "SpaceType" NOT NULL,
    "currency" "Currency" NOT NULL,
    "timezone" TEXT NOT NULL,
    "business_name" TEXT,
    "business_type" TEXT,
    "tax_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "spaces_pkey" PRIMARY KEY ("id")
);

-- User Spaces (many-to-many)
CREATE TABLE "user_spaces" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "role" "SpaceRole" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "user_spaces_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_spaces_user_id_space_id_key" UNIQUE ("user_id", "space_id")
);

-- Accounts table
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "space_id" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "subtype" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "available_balance" DECIMAL(15,2),
    "credit_limit" DECIMAL(15,2),
    "institution_name" TEXT,
    "last_synced_at" TIMESTAMPTZ,
    "connection_status" "ConnectionStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- Budgets table
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "space_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "period" "BudgetPeriod" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- Categories table
CREATE TABLE "categories" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "budget_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budget_amount" DECIMAL(15,2) NOT NULL,
    "spent_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "color" TEXT,
    "icon" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- Transactions table
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "account_id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "category_id" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "description" TEXT NOT NULL,
    "merchant_name" TEXT,
    "date" TIMESTAMPTZ NOT NULL,
    "pending" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- Rules table
CREATE TABLE "rules" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "category_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- Valuation Snapshots table
CREATE TABLE "valuation_snapshots" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "space_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_value" DECIMAL(15,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "breakdown" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "valuation_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "valuation_snapshots_space_id_date_key" UNIQUE ("space_id", "date")
);

-- ESG Asset Scores table
CREATE TABLE "esg_asset_scores" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "account_id" TEXT NOT NULL,
    "asset_symbol" TEXT NOT NULL,
    "asset_name" TEXT NOT NULL,
    "environmental_score" INTEGER NOT NULL,
    "social_score" INTEGER NOT NULL,
    "governance_score" INTEGER NOT NULL,
    "total_score" INTEGER NOT NULL,
    "data_quality" TEXT NOT NULL,
    "last_updated" TIMESTAMPTZ NOT NULL,
    "methodology" TEXT NOT NULL,
    "factors" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "esg_asset_scores_pkey" PRIMARY KEY ("id")
);

-- Audit Logs table
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Feature Flags table
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "rollout" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "feature_flags_name_key" UNIQUE ("name")
);

-- Provider Connections table
CREATE TABLE "provider_connections" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "provider_user_id" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMPTZ,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "provider_connections_pkey" PRIMARY KEY ("id")
);

-- Foreign Key Constraints
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_spaces" ADD CONSTRAINT "user_spaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_spaces" ADD CONSTRAINT "user_spaces_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "categories" ADD CONSTRAINT "categories_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rules" ADD CONSTRAINT "rules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "valuation_snapshots" ADD CONSTRAINT "valuation_snapshots_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "esg_asset_scores" ADD CONSTRAINT "esg_asset_scores_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "provider_connections" ADD CONSTRAINT "provider_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes for performance
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "transactions_account_id_idx" ON "transactions"("account_id");
CREATE INDEX "transactions_space_id_idx" ON "transactions"("space_id");
CREATE INDEX "transactions_date_idx" ON "transactions"("date");
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON spaces FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_provider_connections_updated_at BEFORE UPDATE ON provider_connections FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Success message
SELECT 'Database schema created successfully!' as status;