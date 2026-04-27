-- Add `reconciliation_mismatch` to BillingEventType + `flagged` to BillingStatus
-- so the nightly reconciliation job (apps/api/src/modules/billing/jobs/
-- reconciliation.job.ts) can flag Stripe-vs-local-DB discrepancies as
-- BillingEvent records for manual review without compile errors.
--
-- These are additive enum changes — no data migration required, no rollback
-- impact on existing rows. Postgres ALTER TYPE ... ADD VALUE is non-blocking.

ALTER TYPE "BillingEventType" ADD VALUE IF NOT EXISTS 'reconciliation_mismatch';
ALTER TYPE "BillingStatus" ADD VALUE IF NOT EXISTS 'flagged';
