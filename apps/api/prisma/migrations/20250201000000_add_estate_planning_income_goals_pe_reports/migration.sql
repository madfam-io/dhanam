-- CreateEnum
CREATE TYPE "PECashFlowType" AS ENUM ('capital_call', 'distribution', 'management_fee', 'carry', 'recallable');

-- CreateEnum
CREATE TYPE "CategoryGoalType" AS ENUM ('monthly_spending', 'target_balance', 'weekly_spending', 'percentage_income');

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionTier_new" AS ENUM ('community', 'essentials', 'pro');
ALTER TABLE "users" ALTER COLUMN "subscription_tier" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "subscription_tier" TYPE "SubscriptionTier_new" USING ("subscription_tier"::text::"SubscriptionTier_new");
ALTER TYPE "SubscriptionTier" RENAME TO "SubscriptionTier_old";
ALTER TYPE "SubscriptionTier_new" RENAME TO "SubscriptionTier";
DROP TYPE "SubscriptionTier_old";
ALTER TABLE "users" ALTER COLUMN "subscription_tier" SET DEFAULT 'community';
COMMIT;

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "apr" DECIMAL(6,4),
ADD COLUMN     "credit_limit" DECIMAL(19,4),
ADD COLUMN     "is_overdue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_payment_amount" DECIMAL(19,4),
ADD COLUMN     "last_payment_date" DATE,
ADD COLUMN     "liability_type" TEXT,
ADD COLUMN     "minimum_payment" DECIMAL(19,4),
ADD COLUMN     "next_payment_due_date" DATE,
ADD COLUMN     "original_principal" DECIMAL(19,4),
ADD COLUMN     "origination_date" DATE;

-- AlterTable
ALTER TABLE "provider_health_status" ADD COLUMN     "last_health_check_at" TIMESTAMP(3),
ADD COLUMN     "rate_limit_reset_at" TIMESTAMP(3),
ADD COLUMN     "rate_limited" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_activity_at" TIMESTAMP(3),
ADD COLUMN     "life_beat_alert_days" INTEGER[] DEFAULT ARRAY[30, 60, 90]::INTEGER[],
ADD COLUMN     "life_beat_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "life_beat_legal_agreed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inactivity_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "alert_level" INTEGER NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "responded" BOOLEAN NOT NULL DEFAULT false,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "inactivity_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executor_assignments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "executor_email" TEXT NOT NULL,
    "executor_name" TEXT NOT NULL,
    "executor_user_id" TEXT,
    "relationship" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "access_granted" BOOLEAN NOT NULL DEFAULT false,
    "access_granted_at" TIMESTAMP(3),
    "access_expires_at" TIMESTAMP(3),
    "access_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executor_access_logs" (
    "id" TEXT NOT NULL,
    "executor_assignment_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executor_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_events" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" "Currency" NOT NULL,
    "source" TEXT NOT NULL,
    "description" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL,
    "is_allocated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "income_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_allocations" (
    "id" TEXT NOT NULL,
    "income_event_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "notes" TEXT,
    "allocated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "income_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_goals" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "goal_type" "CategoryGoalType" NOT NULL,
    "target_amount" DECIMAL(19,4),
    "target_date" DATE,
    "monthly_funding" DECIMAL(19,4),
    "percentage_target" DECIMAL(5,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private_equity_cash_flows" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "type" "PECashFlowType" NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" "Currency" NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "private_equity_cash_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_reports" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "schedule" TEXT,
    "format" TEXT NOT NULL DEFAULT 'pdf',
    "filters" JSONB,
    "last_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashflow_forecasts" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "weeks" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cashflow_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_notifications_user_id_read_idx" ON "user_notifications"("user_id", "read");

-- CreateIndex
CREATE INDEX "user_notifications_user_id_created_at_idx" ON "user_notifications"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_notifications_type_idx" ON "user_notifications"("type");

-- CreateIndex
CREATE INDEX "inactivity_alerts_user_id_alert_level_idx" ON "inactivity_alerts"("user_id", "alert_level");

-- CreateIndex
CREATE INDEX "inactivity_alerts_sent_at_idx" ON "inactivity_alerts"("sent_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "inactivity_alerts_user_id_alert_level_sent_at_key" ON "inactivity_alerts"("user_id", "alert_level", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "executor_assignments_access_token_key" ON "executor_assignments"("access_token");

-- CreateIndex
CREATE INDEX "executor_assignments_user_id_idx" ON "executor_assignments"("user_id");

-- CreateIndex
CREATE INDEX "executor_assignments_executor_user_id_idx" ON "executor_assignments"("executor_user_id");

-- CreateIndex
CREATE INDEX "executor_assignments_access_token_idx" ON "executor_assignments"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "executor_assignments_user_id_executor_email_key" ON "executor_assignments"("user_id", "executor_email");

-- CreateIndex
CREATE INDEX "executor_access_logs_executor_assignment_id_created_at_idx" ON "executor_access_logs"("executor_assignment_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "income_events_space_id_received_at_idx" ON "income_events"("space_id", "received_at" DESC);

-- CreateIndex
CREATE INDEX "income_events_space_id_is_allocated_idx" ON "income_events"("space_id", "is_allocated");

-- CreateIndex
CREATE INDEX "income_allocations_income_event_id_idx" ON "income_allocations"("income_event_id");

-- CreateIndex
CREATE INDEX "income_allocations_category_id_idx" ON "income_allocations"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_goals_category_id_key" ON "category_goals"("category_id");

-- CreateIndex
CREATE INDEX "private_equity_cash_flows_asset_id_date_idx" ON "private_equity_cash_flows"("asset_id", "date" DESC);

-- CreateIndex
CREATE INDEX "private_equity_cash_flows_asset_id_type_idx" ON "private_equity_cash_flows"("asset_id", "type");

-- CreateIndex
CREATE INDEX "saved_reports_space_id_idx" ON "saved_reports"("space_id");

-- CreateIndex
CREATE INDEX "cashflow_forecasts_space_id_idx" ON "cashflow_forecasts"("space_id");

-- CreateIndex
CREATE INDEX "provider_health_status_rate_limited_idx" ON "provider_health_status"("rate_limited");

-- CreateIndex
CREATE INDEX "users_last_activity_at_idx" ON "users"("last_activity_at");

-- CreateIndex
CREATE INDEX "users_life_beat_enabled_idx" ON "users"("life_beat_enabled");

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inactivity_alerts" ADD CONSTRAINT "inactivity_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executor_assignments" ADD CONSTRAINT "executor_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executor_assignments" ADD CONSTRAINT "executor_assignments_executor_user_id_fkey" FOREIGN KEY ("executor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_events" ADD CONSTRAINT "income_events_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_allocations" ADD CONSTRAINT "income_allocations_income_event_id_fkey" FOREIGN KEY ("income_event_id") REFERENCES "income_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_allocations" ADD CONSTRAINT "income_allocations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_goals" ADD CONSTRAINT "category_goals_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_equity_cash_flows" ADD CONSTRAINT "private_equity_cash_flows_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "manual_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashflow_forecasts" ADD CONSTRAINT "cashflow_forecasts_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
