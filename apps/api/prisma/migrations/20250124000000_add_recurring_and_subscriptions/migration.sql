-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly');

-- CreateEnum
CREATE TYPE "RecurringStatus" AS ENUM ('detected', 'confirmed', 'dismissed', 'paused');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'trial', 'paused', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "SubscriptionCategory" AS ENUM ('streaming', 'software', 'news', 'gaming', 'music', 'fitness', 'food_delivery', 'cloud_storage', 'productivity', 'education', 'finance', 'other');

-- AlterTable: Add rollover_enabled to budgets
ALTER TABLE "budgets" ADD COLUMN "rollover_enabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add recurring_id to transactions
ALTER TABLE "transactions" ADD COLUMN "recurring_id" TEXT;

-- CreateTable
CREATE TABLE "recurring_transactions" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "merchant_name" TEXT NOT NULL,
    "merchant_pattern" TEXT,
    "expected_amount" DECIMAL(19,4) NOT NULL,
    "amount_variance" DECIMAL(5,2) NOT NULL DEFAULT 0.1,
    "currency" "Currency" NOT NULL,
    "frequency" "RecurrenceFrequency" NOT NULL,
    "status" "RecurringStatus" NOT NULL DEFAULT 'detected',
    "category_id" TEXT,
    "last_occurrence" DATE,
    "next_expected" DATE,
    "occurrence_count" INTEGER NOT NULL DEFAULT 0,
    "confidence" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "first_detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),
    "alert_before_days" INTEGER NOT NULL DEFAULT 3,
    "alert_enabled" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "recurring_id" TEXT,
    "service_name" TEXT NOT NULL,
    "service_url" TEXT,
    "service_icon" TEXT,
    "category" "SubscriptionCategory" NOT NULL DEFAULT 'other',
    "description" TEXT,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" "Currency" NOT NULL,
    "billing_cycle" "RecurrenceFrequency" NOT NULL,
    "next_billing_date" DATE,
    "last_billing_date" DATE,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "trial_end_date" DATE,
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "annual_cost" DECIMAL(19,4) NOT NULL,
    "usage_frequency" TEXT,
    "savings_recommendation" TEXT,
    "alternative_services" JSONB,
    "alert_before_days" INTEGER NOT NULL DEFAULT 3,
    "alert_enabled" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_transactions_space_id_status_idx" ON "recurring_transactions"("space_id", "status");

-- CreateIndex
CREATE INDEX "recurring_transactions_space_id_next_expected_idx" ON "recurring_transactions"("space_id", "next_expected");

-- CreateIndex
CREATE INDEX "recurring_transactions_status_next_expected_idx" ON "recurring_transactions"("status", "next_expected");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_transactions_space_id_merchant_name_frequency_key" ON "recurring_transactions"("space_id", "merchant_name", "frequency");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_recurring_id_key" ON "subscriptions"("recurring_id");

-- CreateIndex
CREATE INDEX "subscriptions_space_id_status_idx" ON "subscriptions"("space_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_space_id_next_billing_date_idx" ON "subscriptions"("space_id", "next_billing_date");

-- CreateIndex
CREATE INDEX "subscriptions_status_next_billing_date_idx" ON "subscriptions"("status", "next_billing_date");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_space_id_service_name_key" ON "subscriptions"("space_id", "service_name");

-- CreateIndex
CREATE INDEX "transactions_recurring_id_idx" ON "transactions"("recurring_id");

-- CreateIndex
CREATE INDEX "transactions_account_id_category_id_idx" ON "transactions"("account_id", "category_id");

-- CreateIndex (missing from init migration)
CREATE INDEX "goals_status_updated_at_idx" ON "goals"("status", "updated_at" DESC);

-- CreateIndex (missing from init migration - user indexes)
CREATE INDEX "users_onboarding_completed_created_at_idx" ON "users"("onboarding_completed", "created_at" DESC);

-- CreateIndex
CREATE INDEX "users_last_login_at_idx" ON "users"("last_login_at" DESC);

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurring_id_fkey" FOREIGN KEY ("recurring_id") REFERENCES "recurring_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_recurring_id_fkey" FOREIGN KEY ("recurring_id") REFERENCES "recurring_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
