-- Dead-letter queue for outbound product-webhook fan-out (Karafiel, Tezca, …).
--
-- Today, when the Stripe MX SPEI relay (and the subscription-lifecycle
-- product-webhook fan-out) POST to a downstream consumer URL and the
-- consumer is restarting / 5xxs / times out, the failure is logged and
-- forgotten — the CFDI for that customer is never issued and nobody
-- notices. This table captures the failed delivery so an auto-retry
-- job (and an admin-triggered manual replay endpoint) can re-deliver
-- it without operator help.
--
-- See:
--   internal-devops/ecosystem/monetization-architecture-2026-04-26.md
--   apps/api/src/modules/billing/services/webhook-dlq.service.ts
--   apps/api/src/modules/billing/jobs/webhook-dlq-retry.job.ts
--   apps/api/src/modules/billing/dlq.controller.ts

-- CreateTable
CREATE TABLE "webhook_delivery_failures" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "consumer" TEXT NOT NULL,
    "consumer_url" TEXT NOT NULL,
    "event_type" TEXT,
    "payload" JSONB NOT NULL,
    "signature_header" TEXT NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 1,
    "last_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_status_code" INTEGER,
    "last_error_message" TEXT,
    "next_retry_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_delivery_failures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: lookup by source event id (debugging + admin filter)
CREATE INDEX "webhook_delivery_failures_event_id_idx" ON "webhook_delivery_failures"("event_id");

-- CreateIndex: per-consumer failure-rate dashboards + admin filter
CREATE INDEX "webhook_delivery_failures_consumer_idx" ON "webhook_delivery_failures"("consumer");

-- CreateIndex: list unresolved failures, newest first (admin DLQ view)
CREATE INDEX "webhook_delivery_failures_resolved_created_idx"
    ON "webhook_delivery_failures"("resolved_at", "created_at" DESC);

-- CreateIndex: partial index for the auto-retry job's hot scan path —
-- only unresolved rows whose next retry has come due. PostgreSQL can
-- serve "select … where resolved_at is null and next_retry_at <= now()"
-- straight from this index without touching resolved rows.
CREATE INDEX "webhook_delivery_failures_due_for_retry_idx"
    ON "webhook_delivery_failures"("next_retry_at")
    WHERE "resolved_at" IS NULL;
