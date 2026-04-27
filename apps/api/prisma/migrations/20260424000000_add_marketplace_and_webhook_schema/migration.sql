-- Marketplace / Connect primitives + outbound webhook fabric.
-- See docs/rfcs/connect-marketplace.md.

-- CreateTable
CREATE TABLE "merchant_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "processor_id" TEXT NOT NULL,
    "external_account_id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "default_currency" "Currency" NOT NULL,
    "charges_enabled" BOOLEAN NOT NULL DEFAULT false,
    "payouts_enabled" BOOLEAN NOT NULL DEFAULT false,
    "details_submitted" BOOLEAN NOT NULL DEFAULT false,
    "requirements" JSONB,
    "business_type" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "onboarded_at" TIMESTAMP(3),
    "disabled_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL,
    "merchant_account_id" TEXT NOT NULL,
    "external_transfer_id" TEXT NOT NULL,
    "source_charge_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "status" TEXT NOT NULL,
    "failure_code" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversed_at" TIMESTAMP(3),

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "merchant_account_id" TEXT NOT NULL,
    "external_payout_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "status" TEXT NOT NULL,
    "method" TEXT,
    "arrival_date" TIMESTAMP(3),
    "failure_code" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "merchant_account_id" TEXT NOT NULL,
    "external_dispute_id" TEXT NOT NULL,
    "external_charge_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "evidence_due_by" TIMESTAMP(3),
    "evidence" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_fees" (
    "id" TEXT NOT NULL,
    "merchant_account_id" TEXT NOT NULL,
    "external_fee_id" TEXT NOT NULL,
    "external_charge_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "refunded" BOOLEAN NOT NULL DEFAULT false,
    "refunded_amount" DECIMAL(12,2),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" TEXT NOT NULL,
    "consumer_app_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "svix_endpoint_id" TEXT,
    "subscribed_events" TEXT[],
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "disabled_at" TIMESTAMP(3),

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "webhook_endpoint_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "svix_message_id" TEXT,
    "payload" JSONB NOT NULL,
    "last_status" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "delivered_at" TIMESTAMP(3),
    "last_attempt_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merchant_accounts_processor_id_external_account_id_key" ON "merchant_accounts"("processor_id", "external_account_id");

-- CreateIndex
CREATE INDEX "merchant_accounts_user_id_idx" ON "merchant_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "transfers_external_transfer_id_key" ON "transfers"("external_transfer_id");

-- CreateIndex
CREATE INDEX "transfers_merchant_account_id_idx" ON "transfers"("merchant_account_id");

-- CreateIndex
CREATE INDEX "transfers_source_charge_id_idx" ON "transfers"("source_charge_id");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_external_payout_id_key" ON "payouts"("external_payout_id");

-- CreateIndex
CREATE INDEX "payouts_merchant_account_id_idx" ON "payouts"("merchant_account_id");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_external_dispute_id_key" ON "disputes"("external_dispute_id");

-- CreateIndex
CREATE INDEX "disputes_merchant_account_id_idx" ON "disputes"("merchant_account_id");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "application_fees_external_fee_id_key" ON "application_fees"("external_fee_id");

-- CreateIndex
CREATE INDEX "application_fees_merchant_account_id_idx" ON "application_fees"("merchant_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_endpoints_svix_endpoint_id_key" ON "webhook_endpoints"("svix_endpoint_id");

-- CreateIndex
CREATE INDEX "webhook_endpoints_consumer_app_id_idx" ON "webhook_endpoints"("consumer_app_id");

-- CreateIndex
CREATE INDEX "webhook_endpoints_active_idx" ON "webhook_endpoints"("active");

-- CreateIndex
CREATE INDEX "webhook_deliveries_webhook_endpoint_id_idx" ON "webhook_deliveries"("webhook_endpoint_id");

-- CreateIndex
CREATE INDEX "webhook_deliveries_event_id_idx" ON "webhook_deliveries"("event_id");

-- CreateIndex
CREATE INDEX "webhook_deliveries_delivered_at_idx" ON "webhook_deliveries"("delivered_at");

-- AddForeignKey
ALTER TABLE "merchant_accounts" ADD CONSTRAINT "merchant_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_merchant_account_id_fkey" FOREIGN KEY ("merchant_account_id") REFERENCES "merchant_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_merchant_account_id_fkey" FOREIGN KEY ("merchant_account_id") REFERENCES "merchant_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_merchant_account_id_fkey" FOREIGN KEY ("merchant_account_id") REFERENCES "merchant_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_fees" ADD CONSTRAINT "application_fees_merchant_account_id_fkey" FOREIGN KEY ("merchant_account_id") REFERENCES "merchant_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_endpoint_id_fkey" FOREIGN KEY ("webhook_endpoint_id") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
