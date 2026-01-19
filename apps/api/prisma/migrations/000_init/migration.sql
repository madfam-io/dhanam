-- CreateEnum
CREATE TYPE "SpaceType" AS ENUM ('personal', 'business');

-- CreateEnum
CREATE TYPE "SpaceRole" AS ENUM ('owner', 'admin', 'member', 'viewer');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('checking', 'savings', 'credit', 'investment', 'crypto', 'other');

-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('belvo', 'plaid', 'mx', 'finicity', 'bitso', 'blockchain', 'manual');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('active', 'error', 'syncing', 'disconnected');

-- CreateEnum
CREATE TYPE "BudgetPeriod" AS ENUM ('monthly', 'quarterly', 'yearly');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('MXN', 'USD', 'EUR');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('free', 'premium');

-- CreateEnum
CREATE TYPE "BillingEventType" AS ENUM ('subscription_created', 'subscription_renewed', 'subscription_cancelled', 'payment_succeeded', 'payment_failed', 'refund_issued');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "UsageMetricType" AS ENUM ('esg_calculation', 'monte_carlo_simulation', 'goal_probability', 'scenario_analysis', 'portfolio_rebalance', 'api_request');

-- CreateEnum
CREATE TYPE "ManualAssetType" AS ENUM ('real_estate', 'vehicle', 'domain', 'private_equity', 'angel_investment', 'collectible', 'art', 'jewelry', 'other');

-- CreateEnum
CREATE TYPE "AccountOwnership" AS ENUM ('individual', 'joint', 'trust');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('retirement', 'education', 'house_purchase', 'emergency_fund', 'legacy', 'travel', 'business', 'debt_payoff', 'other');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('active', 'paused', 'achieved', 'abandoned');

-- CreateEnum
CREATE TYPE "GoalShareRole" AS ENUM ('viewer', 'contributor', 'editor', 'manager');

-- CreateEnum
CREATE TYPE "GoalShareStatus" AS ENUM ('pending', 'accepted', 'declined', 'revoked');

-- CreateEnum
CREATE TYPE "GoalActivityAction" AS ENUM ('created', 'updated', 'shared', 'share_accepted', 'share_declined', 'contribution_added', 'probability_improved', 'probability_declined', 'milestone_reached', 'target_date_extended', 'target_amount_adjusted', 'allocation_updated', 'what_if_scenario_run', 'comment_added', 'achieved', 'paused', 'abandoned');

-- CreateEnum
CREATE TYPE "HouseholdType" AS ENUM ('family', 'trust', 'estate', 'partnership');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('spouse', 'partner', 'child', 'parent', 'sibling', 'grandparent', 'grandchild', 'dependent', 'trustee', 'beneficiary', 'other');

-- CreateEnum
CREATE TYPE "SimulationType" AS ENUM ('monte_carlo', 'retirement', 'goal_probability', 'safe_withdrawal', 'scenario_analysis');

-- CreateEnum
CREATE TYPE "WillStatus" AS ENUM ('draft', 'active', 'revoked', 'executed');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('bank_account', 'investment_account', 'crypto_account', 'real_estate', 'business_interest', 'personal_property', 'other');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('buy', 'sell', 'transfer', 'deposit', 'withdraw');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending_verification', 'pending_execution', 'pending_trigger', 'executing', 'completed', 'failed', 'cancelled', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "AdvancedOrderType" AS ENUM ('stop_loss', 'take_profit', 'trailing_stop', 'oco');

-- CreateEnum
CREATE TYPE "RecurrencePattern" AS ENUM ('once', 'daily', 'weekly', 'monthly', 'quarterly');

-- CreateEnum
CREATE TYPE "OrderPriority" AS ENUM ('low', 'normal', 'high', 'critical');

-- CreateEnum
CREATE TYPE "ExecutionProvider" AS ENUM ('bitso', 'plaid', 'belvo', 'manual');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date_of_birth" DATE,
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
    "onboarding_completed_at" TIMESTAMP(3),
    "onboarding_step" TEXT,
    "last_login_at" TIMESTAMP(3),
    "subscription_tier" "SubscriptionTier" NOT NULL DEFAULT 'free',
    "subscription_started_at" TIMESTAMP(3),
    "subscription_expires_at" TIMESTAMP(3),
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "janua_customer_id" TEXT,
    "billing_provider" TEXT,
    "country_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_family" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "encrypted_token" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SpaceType" NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'MXN',
    "timezone" TEXT NOT NULL DEFAULT 'America/Mexico_City',
    "household_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_spaces" (
    "user_id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "role" "SpaceRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_spaces_pkey" PRIMARY KEY ("user_id","space_id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "provider_account_id" TEXT,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "subtype" TEXT,
    "currency" "Currency" NOT NULL,
    "balance" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "ownership" "AccountOwnership" NOT NULL DEFAULT 'individual',
    "owner_id" TEXT,
    "encrypted_credentials" JSONB,
    "metadata" JSONB,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connections" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL,
    "error" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_transaction_id" TEXT,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" "Currency" NOT NULL,
    "description" TEXT NOT NULL,
    "merchant" TEXT,
    "category_id" TEXT,
    "date" DATE NOT NULL,
    "pending" BOOLEAN NOT NULL DEFAULT false,
    "is_split" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "budget_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budgeted_amount" DECIMAL(19,4) NOT NULL,
    "carryover_amount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "icon" TEXT,
    "color" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_rules" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "category_id" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "period" "BudgetPeriod" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "income" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_valuations" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "value" DECIMAL(19,4) NOT NULL,
    "currency" "Currency" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esg_scores" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "asset_symbol" TEXT NOT NULL,
    "environmental_score" DECIMAL(5,2),
    "social_score" DECIMAL(5,2),
    "governance_score" DECIMAL(5,2),
    "composite_score" DECIMAL(5,2),
    "calculated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "esg_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_assets" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ManualAssetType" NOT NULL,
    "description" TEXT,
    "current_value" DECIMAL(19,4) NOT NULL,
    "currency" "Currency" NOT NULL,
    "acquisition_date" DATE,
    "acquisition_cost" DECIMAL(19,4),
    "metadata" JSONB,
    "documents" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_asset_valuations" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "value" DECIMAL(19,4) NOT NULL,
    "currency" "Currency" NOT NULL,
    "source" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manual_asset_valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resource_id" TEXT,
    "metadata" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'low',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "context" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "from_currency" "Currency" NOT NULL,
    "to_currency" "Currency" NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "date" DATE NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'banxico',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "BillingEventType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "status" "BillingStatus" NOT NULL,
    "stripe_event_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "metric_type" "UsageMetricType" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "date" DATE NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "usage_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "household_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "GoalType" NOT NULL,
    "targetAmount" DECIMAL(19,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "targetDate" DATE NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "status" "GoalStatus" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "current_probability" DECIMAL(5,2),
    "confidence_low" DECIMAL(19,4),
    "confidence_high" DECIMAL(19,4),
    "last_simulation_at" TIMESTAMP(3),
    "probability_history" JSONB,
    "current_progress" DECIMAL(5,2),
    "projected_completion" DATE,
    "expected_return" DECIMAL(5,4),
    "volatility" DECIMAL(5,4),
    "monthly_contribution" DECIMAL(19,4),
    "created_by" TEXT,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "shared_with_message" TEXT,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_allocations" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_shares" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "shared_with" TEXT NOT NULL,
    "role" "GoalShareRole" NOT NULL DEFAULT 'viewer',
    "invited_by" TEXT NOT NULL,
    "status" "GoalShareStatus" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_activities" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" "GoalActivityAction" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "space_id" TEXT,
    "goal_id" TEXT,
    "type" "SimulationType" NOT NULL,
    "config" JSONB NOT NULL,
    "result" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "execution_time_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "HouseholdType" NOT NULL DEFAULT 'family',
    "baseCurrency" "Currency" NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_members" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "relationship" "RelationshipType" NOT NULL,
    "is_minor" BOOLEAN NOT NULL DEFAULT false,
    "access_start_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wills" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "WillStatus" NOT NULL DEFAULT 'draft',
    "last_reviewed_at" TIMESTAMP(3),
    "activated_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "executed_at" TIMESTAMP(3),
    "notes" TEXT,
    "legal_disclaimer" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiary_designations" (
    "id" TEXT NOT NULL,
    "will_id" TEXT NOT NULL,
    "beneficiary_id" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "asset_id" TEXT,
    "percentage" DECIMAL(5,2) NOT NULL,
    "conditions" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiary_designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "will_executors" (
    "id" TEXT NOT NULL,
    "will_id" TEXT NOT NULL,
    "executor_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 1,
    "accepted_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "will_executors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_orders" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "type" "OrderType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending_verification',
    "priority" "OrderPriority" NOT NULL DEFAULT 'normal',
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" "Currency" NOT NULL,
    "asset_symbol" TEXT,
    "target_price" DECIMAL(19,4),
    "to_account_id" TEXT,
    "provider" "ExecutionProvider" NOT NULL,
    "dry_run" BOOLEAN NOT NULL DEFAULT false,
    "max_slippage" DECIMAL(5,2),
    "advanced_type" "AdvancedOrderType",
    "stop_price" DECIMAL(19,4),
    "take_profit_price" DECIMAL(19,4),
    "trailing_amount" DECIMAL(19,4),
    "trailing_percent" DECIMAL(5,2),
    "linked_order_id" TEXT,
    "highest_price" DECIMAL(19,4),
    "last_price_check" TIMESTAMP(3),
    "scheduled_for" TIMESTAMP(3),
    "recurrence" "RecurrencePattern" DEFAULT 'once',
    "recurrence_day" INTEGER,
    "recurrence_end" TIMESTAMP(3),
    "next_execution_at" TIMESTAMP(3),
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "max_executions" INTEGER,
    "otp_verified" BOOLEAN NOT NULL DEFAULT false,
    "otp_verified_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "user_agent" TEXT,
    "goal_id" TEXT,
    "auto_execute" BOOLEAN NOT NULL DEFAULT false,
    "executed_amount" DECIMAL(19,4),
    "executed_price" DECIMAL(19,4),
    "fees" DECIMAL(19,4),
    "fee_currency" "Currency",
    "provider_order_id" TEXT,
    "provider_response" JSONB,
    "notes" TEXT,
    "metadata" JSONB,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP(3),
    "executed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_executions" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "status" "OrderStatus" NOT NULL,
    "provider" "ExecutionProvider" NOT NULL,
    "provider_order_id" TEXT,
    "executed_amount" DECIMAL(19,4),
    "executed_price" DECIMAL(19,4),
    "fees" DECIMAL(19,4),
    "fee_currency" "Currency",
    "error_code" TEXT,
    "error_message" TEXT,
    "provider_request" JSONB,
    "provider_response" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "order_id" TEXT,
    "response_status" INTEGER,
    "response_body" JSONB,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_limits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "space_id" TEXT,
    "limit_type" TEXT NOT NULL,
    "order_type" "OrderType",
    "max_amount" DECIMAL(19,4) NOT NULL,
    "currency" "Currency" NOT NULL,
    "used_amount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "reset_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "enforced" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution_provider_mappings" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "primary_provider" "Provider" NOT NULL,
    "backupProviders" JSONB NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'US',
    "provider_metadata" JSONB,
    "last_health_check" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institution_provider_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_health_status" (
    "id" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'US',
    "status" TEXT NOT NULL DEFAULT 'healthy',
    "error_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avg_response_time_ms" INTEGER NOT NULL DEFAULT 0,
    "successful_calls" INTEGER NOT NULL DEFAULT 0,
    "failed_calls" INTEGER NOT NULL DEFAULT 0,
    "last_success_at" TIMESTAMP(3),
    "last_failure_at" TIMESTAMP(3),
    "last_error" TEXT,
    "circuit_breaker_open" BOOLEAN NOT NULL DEFAULT false,
    "window_start_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_health_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_attempts" (
    "id" TEXT NOT NULL,
    "account_id" TEXT,
    "space_id" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "institution_id" TEXT,
    "attempt_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error_code" TEXT,
    "error_message" TEXT,
    "response_time_ms" INTEGER,
    "failover_used" BOOLEAN NOT NULL DEFAULT false,
    "failover_provider" "Provider",
    "metadata" JSONB,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connection_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_splits" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "percentage" DECIMAL(5,2),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_sharing_permissions" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "shared_with_id" TEXT NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT true,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_sharing_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_subscription_id_key" ON "users"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_janua_customer_id_key" ON "users"("janua_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_family_key" ON "sessions"("token_family");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_token_family_idx" ON "sessions"("token_family");

-- CreateIndex
CREATE INDEX "provider_connections_user_id_idx" ON "provider_connections"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_connections_user_id_provider_provider_user_id_key" ON "provider_connections"("user_id", "provider", "provider_user_id");

-- CreateIndex
CREATE INDEX "spaces_household_id_idx" ON "spaces"("household_id");

-- CreateIndex
CREATE INDEX "accounts_space_id_idx" ON "accounts"("space_id");

-- CreateIndex
CREATE INDEX "accounts_space_id_ownership_idx" ON "accounts"("space_id", "ownership");

-- CreateIndex
CREATE INDEX "accounts_space_id_owner_id_idx" ON "accounts"("space_id", "owner_id");

-- CreateIndex
CREATE INDEX "accounts_space_id_last_synced_at_idx" ON "accounts"("space_id", "last_synced_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_space_id_provider_provider_account_id_key" ON "accounts"("space_id", "provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "connections_account_id_key" ON "connections"("account_id");

-- CreateIndex
CREATE INDEX "transactions_account_id_date_idx" ON "transactions"("account_id", "date" DESC);

-- CreateIndex
CREATE INDEX "transactions_category_id_idx" ON "transactions"("category_id");

-- CreateIndex
CREATE INDEX "transactions_pending_idx" ON "transactions"("pending");

-- CreateIndex
CREATE INDEX "transactions_is_split_idx" ON "transactions"("is_split");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_account_id_provider_transaction_id_key" ON "transactions"("account_id", "provider_transaction_id");

-- CreateIndex
CREATE INDEX "categories_budget_id_idx" ON "categories"("budget_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_budget_id_name_key" ON "categories"("budget_id", "name");

-- CreateIndex
CREATE INDEX "transaction_rules_space_id_enabled_idx" ON "transaction_rules"("space_id", "enabled");

-- CreateIndex
CREATE INDEX "budgets_space_id_idx" ON "budgets"("space_id");

-- CreateIndex
CREATE INDEX "asset_valuations_account_id_date_idx" ON "asset_valuations"("account_id", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "asset_valuations_account_id_date_key" ON "asset_valuations"("account_id", "date");

-- CreateIndex
CREATE INDEX "esg_scores_account_id_calculated_at_idx" ON "esg_scores"("account_id", "calculated_at" DESC);

-- CreateIndex
CREATE INDEX "manual_assets_space_id_idx" ON "manual_assets"("space_id");

-- CreateIndex
CREATE INDEX "manual_assets_type_idx" ON "manual_assets"("type");

-- CreateIndex
CREATE INDEX "manual_asset_valuations_asset_id_date_idx" ON "manual_asset_valuations"("asset_id", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "manual_asset_valuations_asset_id_date_key" ON "manual_asset_valuations"("asset_id", "date");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_action_timestamp_idx" ON "audit_logs"("user_id", "action", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_resource_resource_id_idx" ON "audit_logs"("resource", "resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_severity_timestamp_idx" ON "audit_logs"("severity", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "webhook_events_provider_processed_created_at_idx" ON "webhook_events"("provider", "processed", "created_at");

-- CreateIndex
CREATE INDEX "error_logs_timestamp_idx" ON "error_logs"("timestamp");

-- CreateIndex
CREATE INDEX "error_logs_level_idx" ON "error_logs"("level");

-- CreateIndex
CREATE INDEX "error_logs_message_idx" ON "error_logs"("message");

-- CreateIndex
CREATE INDEX "exchange_rates_from_currency_to_currency_idx" ON "exchange_rates"("from_currency", "to_currency");

-- CreateIndex
CREATE INDEX "exchange_rates_date_idx" ON "exchange_rates"("date");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_from_currency_to_currency_date_key" ON "exchange_rates"("from_currency", "to_currency", "date");

-- CreateIndex
CREATE UNIQUE INDEX "billing_events_stripe_event_id_key" ON "billing_events"("stripe_event_id");

-- CreateIndex
CREATE INDEX "billing_events_user_id_created_at_idx" ON "billing_events"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "billing_events_status_idx" ON "billing_events"("status");

-- CreateIndex
CREATE INDEX "usage_metrics_user_id_date_idx" ON "usage_metrics"("user_id", "date" DESC);

-- CreateIndex
CREATE INDEX "usage_metrics_metric_type_date_idx" ON "usage_metrics"("metric_type", "date");

-- CreateIndex
CREATE UNIQUE INDEX "usage_metrics_user_id_metric_type_date_key" ON "usage_metrics"("user_id", "metric_type", "date");

-- CreateIndex
CREATE INDEX "goals_space_id_status_idx" ON "goals"("space_id", "status");

-- CreateIndex
CREATE INDEX "goals_space_id_created_at_idx" ON "goals"("space_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "goals_household_id_idx" ON "goals"("household_id");

-- CreateIndex
CREATE INDEX "goals_current_probability_idx" ON "goals"("current_probability");

-- CreateIndex
CREATE INDEX "goals_created_by_idx" ON "goals"("created_by");

-- CreateIndex
CREATE INDEX "goals_is_shared_idx" ON "goals"("is_shared");

-- CreateIndex
CREATE INDEX "goal_allocations_goal_id_idx" ON "goal_allocations"("goal_id");

-- CreateIndex
CREATE INDEX "goal_allocations_account_id_idx" ON "goal_allocations"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "goal_allocations_goal_id_account_id_key" ON "goal_allocations"("goal_id", "account_id");

-- CreateIndex
CREATE INDEX "goal_shares_goal_id_idx" ON "goal_shares"("goal_id");

-- CreateIndex
CREATE INDEX "goal_shares_shared_with_idx" ON "goal_shares"("shared_with");

-- CreateIndex
CREATE INDEX "goal_shares_status_idx" ON "goal_shares"("status");

-- CreateIndex
CREATE UNIQUE INDEX "goal_shares_goal_id_shared_with_key" ON "goal_shares"("goal_id", "shared_with");

-- CreateIndex
CREATE INDEX "goal_activities_goal_id_created_at_idx" ON "goal_activities"("goal_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "goal_activities_user_id_idx" ON "goal_activities"("user_id");

-- CreateIndex
CREATE INDEX "simulations_user_id_created_at_idx" ON "simulations"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "simulations_space_id_idx" ON "simulations"("space_id");

-- CreateIndex
CREATE INDEX "simulations_goal_id_idx" ON "simulations"("goal_id");

-- CreateIndex
CREATE INDEX "simulations_type_idx" ON "simulations"("type");

-- CreateIndex
CREATE INDEX "households_created_at_idx" ON "households"("created_at");

-- CreateIndex
CREATE INDEX "household_members_household_id_idx" ON "household_members"("household_id");

-- CreateIndex
CREATE INDEX "household_members_user_id_idx" ON "household_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "household_members_household_id_user_id_key" ON "household_members"("household_id", "user_id");

-- CreateIndex
CREATE INDEX "wills_household_id_idx" ON "wills"("household_id");

-- CreateIndex
CREATE INDEX "wills_status_idx" ON "wills"("status");

-- CreateIndex
CREATE INDEX "beneficiary_designations_will_id_idx" ON "beneficiary_designations"("will_id");

-- CreateIndex
CREATE INDEX "beneficiary_designations_beneficiary_id_idx" ON "beneficiary_designations"("beneficiary_id");

-- CreateIndex
CREATE INDEX "will_executors_will_id_idx" ON "will_executors"("will_id");

-- CreateIndex
CREATE INDEX "will_executors_executor_id_idx" ON "will_executors"("executor_id");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_orders_idempotency_key_key" ON "transaction_orders"("idempotency_key");

-- CreateIndex
CREATE INDEX "transaction_orders_space_id_status_created_at_idx" ON "transaction_orders"("space_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "transaction_orders_user_id_status_idx" ON "transaction_orders"("user_id", "status");

-- CreateIndex
CREATE INDEX "transaction_orders_account_id_idx" ON "transaction_orders"("account_id");

-- CreateIndex
CREATE INDEX "transaction_orders_status_priority_idx" ON "transaction_orders"("status", "priority");

-- CreateIndex
CREATE INDEX "transaction_orders_goal_id_idx" ON "transaction_orders"("goal_id");

-- CreateIndex
CREATE INDEX "transaction_orders_idempotency_key_idx" ON "transaction_orders"("idempotency_key");

-- CreateIndex
CREATE INDEX "transaction_orders_status_advanced_type_last_price_check_idx" ON "transaction_orders"("status", "advanced_type", "last_price_check");

-- CreateIndex
CREATE INDEX "transaction_orders_status_scheduled_for_idx" ON "transaction_orders"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "transaction_orders_status_next_execution_at_idx" ON "transaction_orders"("status", "next_execution_at");

-- CreateIndex
CREATE INDEX "order_executions_order_id_attempt_number_idx" ON "order_executions"("order_id", "attempt_number");

-- CreateIndex
CREATE INDEX "order_executions_status_started_at_idx" ON "order_executions"("status", "started_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_key" ON "idempotency_keys"("key");

-- CreateIndex
CREATE INDEX "idempotency_keys_user_id_space_id_created_at_idx" ON "idempotency_keys"("user_id", "space_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

-- CreateIndex
CREATE INDEX "order_limits_user_id_enforced_reset_at_idx" ON "order_limits"("user_id", "enforced", "reset_at");

-- CreateIndex
CREATE INDEX "order_limits_space_id_idx" ON "order_limits"("space_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_limits_user_id_space_id_limit_type_order_type_key" ON "order_limits"("user_id", "space_id", "limit_type", "order_type");

-- CreateIndex
CREATE INDEX "institution_provider_mappings_institution_name_idx" ON "institution_provider_mappings"("institution_name");

-- CreateIndex
CREATE INDEX "institution_provider_mappings_region_idx" ON "institution_provider_mappings"("region");

-- CreateIndex
CREATE UNIQUE INDEX "institution_provider_mappings_institution_id_primary_provid_key" ON "institution_provider_mappings"("institution_id", "primary_provider");

-- CreateIndex
CREATE INDEX "provider_health_status_status_idx" ON "provider_health_status"("status");

-- CreateIndex
CREATE INDEX "provider_health_status_circuit_breaker_open_idx" ON "provider_health_status"("circuit_breaker_open");

-- CreateIndex
CREATE UNIQUE INDEX "provider_health_status_provider_region_key" ON "provider_health_status"("provider", "region");

-- CreateIndex
CREATE INDEX "connection_attempts_account_id_attempted_at_idx" ON "connection_attempts"("account_id", "attempted_at" DESC);

-- CreateIndex
CREATE INDEX "connection_attempts_provider_status_attempted_at_idx" ON "connection_attempts"("provider", "status", "attempted_at" DESC);

-- CreateIndex
CREATE INDEX "connection_attempts_space_id_attempted_at_idx" ON "connection_attempts"("space_id", "attempted_at" DESC);

-- CreateIndex
CREATE INDEX "transaction_splits_user_id_idx" ON "transaction_splits"("user_id");

-- CreateIndex
CREATE INDEX "transaction_splits_transaction_id_idx" ON "transaction_splits"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_splits_transaction_id_user_id_key" ON "transaction_splits"("transaction_id", "user_id");

-- CreateIndex
CREATE INDEX "account_sharing_permissions_shared_with_id_idx" ON "account_sharing_permissions"("shared_with_id");

-- CreateIndex
CREATE INDEX "account_sharing_permissions_account_id_can_view_idx" ON "account_sharing_permissions"("account_id", "can_view");

-- CreateIndex
CREATE UNIQUE INDEX "account_sharing_permissions_account_id_shared_with_id_key" ON "account_sharing_permissions"("account_id", "shared_with_id");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_connections" ADD CONSTRAINT "provider_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_spaces" ADD CONSTRAINT "user_spaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_spaces" ADD CONSTRAINT "user_spaces_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_rules" ADD CONSTRAINT "transaction_rules_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_rules" ADD CONSTRAINT "transaction_rules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_valuations" ADD CONSTRAINT "asset_valuations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esg_scores" ADD CONSTRAINT "esg_scores_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_assets" ADD CONSTRAINT "manual_assets_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_asset_valuations" ADD CONSTRAINT "manual_asset_valuations_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "manual_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_metrics" ADD CONSTRAINT "usage_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_allocations" ADD CONSTRAINT "goal_allocations_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_allocations" ADD CONSTRAINT "goal_allocations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_shares" ADD CONSTRAINT "goal_shares_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_shares" ADD CONSTRAINT "goal_shares_shared_with_fkey" FOREIGN KEY ("shared_with") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_shares" ADD CONSTRAINT "goal_shares_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_activities" ADD CONSTRAINT "goal_activities_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_activities" ADD CONSTRAINT "goal_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wills" ADD CONSTRAINT "wills_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_designations" ADD CONSTRAINT "beneficiary_designations_will_id_fkey" FOREIGN KEY ("will_id") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_designations" ADD CONSTRAINT "beneficiary_designations_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "household_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_executors" ADD CONSTRAINT "will_executors_will_id_fkey" FOREIGN KEY ("will_id") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_executors" ADD CONSTRAINT "will_executors_executor_id_fkey" FOREIGN KEY ("executor_id") REFERENCES "household_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_orders" ADD CONSTRAINT "transaction_orders_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_orders" ADD CONSTRAINT "transaction_orders_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_orders" ADD CONSTRAINT "transaction_orders_to_account_id_fkey" FOREIGN KEY ("to_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_orders" ADD CONSTRAINT "transaction_orders_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_executions" ADD CONSTRAINT "order_executions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "transaction_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_attempts" ADD CONSTRAINT "connection_attempts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_attempts" ADD CONSTRAINT "connection_attempts_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_splits" ADD CONSTRAINT "transaction_splits_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_splits" ADD CONSTRAINT "transaction_splits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_sharing_permissions" ADD CONSTRAINT "account_sharing_permissions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_sharing_permissions" ADD CONSTRAINT "account_sharing_permissions_shared_with_id_fkey" FOREIGN KEY ("shared_with_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

