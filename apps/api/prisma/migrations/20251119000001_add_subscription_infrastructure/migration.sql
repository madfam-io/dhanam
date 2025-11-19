-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('free', 'premium');

-- CreateEnum
CREATE TYPE "BillingEventType" AS ENUM ('subscription_created', 'subscription_renewed', 'subscription_cancelled', 'payment_succeeded', 'payment_failed', 'refund_issued');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "UsageMetricType" AS ENUM ('esg_calculation', 'monte_carlo_simulation', 'goal_probability', 'scenario_analysis', 'portfolio_rebalance', 'api_request');

-- AlterTable: Add subscription fields to users table
ALTER TABLE "users" ADD COLUMN "subscription_tier" "SubscriptionTier" NOT NULL DEFAULT 'free';
ALTER TABLE "users" ADD COLUMN "subscription_started_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "subscription_expires_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" TEXT;
ALTER TABLE "users" ADD COLUMN "stripe_subscription_id" TEXT;

-- CreateIndex: Add unique constraints for Stripe IDs
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");
CREATE UNIQUE INDEX "users_stripe_subscription_id_key" ON "users"("stripe_subscription_id");

-- CreateTable: billing_events
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

-- CreateTable: usage_metrics
CREATE TABLE "usage_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "metric_type" "UsageMetricType" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "date" DATE NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "usage_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: billing_events indexes
CREATE INDEX "billing_events_user_id_created_at_idx" ON "billing_events"("user_id", "created_at" DESC);
CREATE INDEX "billing_events_status_idx" ON "billing_events"("status");
CREATE UNIQUE INDEX "billing_events_stripe_event_id_key" ON "billing_events"("stripe_event_id");

-- CreateIndex: usage_metrics indexes
CREATE INDEX "usage_metrics_user_id_date_idx" ON "usage_metrics"("user_id", "date" DESC);
CREATE INDEX "usage_metrics_metric_type_date_idx" ON "usage_metrics"("metric_type", "date");
CREATE UNIQUE INDEX "usage_metrics_user_id_metric_type_date_key" ON "usage_metrics"("user_id", "metric_type", "date");

-- AddForeignKey
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_metrics" ADD CONSTRAINT "usage_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
