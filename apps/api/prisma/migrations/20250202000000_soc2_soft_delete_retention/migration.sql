-- SOC 2 Compliance: Soft delete and retention fields

-- Add deletedAt to users
ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- Add deletedAt to accounts
ALTER TABLE "accounts" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- Add deletedAt to transactions
ALTER TABLE "transactions" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- Add deletedAt to spaces
ALTER TABLE "spaces" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- Add deletedAt and retainUntil to audit_logs
ALTER TABLE "audit_logs" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "audit_logs" ADD COLUMN "retain_until" TIMESTAMP(3);

-- RLS-prep indexes
CREATE INDEX "accounts_space_id_deleted_at_idx" ON "accounts"("space_id", "deleted_at");
CREATE INDEX "transactions_account_id_date_deleted_at_idx" ON "transactions"("account_id", "date" DESC, "deleted_at");
CREATE INDEX "spaces_deleted_at_idx" ON "spaces"("deleted_at");
