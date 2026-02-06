-- AlterTable: add missing columns to saved_reports
ALTER TABLE "saved_reports" ADD COLUMN IF NOT EXISTS "created_by" TEXT;
ALTER TABLE "saved_reports" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "saved_reports" ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "saved_reports" ADD COLUMN IF NOT EXISTS "is_shared" BOOLEAN NOT NULL DEFAULT false;

-- Backfill created_by with a placeholder for existing rows (if any)
UPDATE "saved_reports" SET "created_by" = "space_id" WHERE "created_by" IS NULL;
ALTER TABLE "saved_reports" ALTER COLUMN "created_by" SET NOT NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "saved_reports_created_by_idx" ON "saved_reports"("created_by");

-- AddForeignKey
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE IF NOT EXISTS "generated_reports" (
    "id" TEXT NOT NULL,
    "saved_report_id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "generated_by" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "r2_key" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "generated_reports_saved_report_id_idx" ON "generated_reports"("saved_report_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "generated_reports_space_id_created_at_idx" ON "generated_reports"("space_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_saved_report_id_fkey" FOREIGN KEY ("saved_report_id") REFERENCES "saved_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE IF NOT EXISTS "report_shares" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "shared_with" TEXT NOT NULL,
    "invited_by" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "report_shares_report_id_shared_with_key" ON "report_shares"("report_id", "shared_with");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "report_shares_shared_with_status_idx" ON "report_shares"("shared_with", "status");

-- AddForeignKey
ALTER TABLE "report_shares" ADD CONSTRAINT "report_shares_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "saved_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_shares" ADD CONSTRAINT "report_shares_shared_with_fkey" FOREIGN KEY ("shared_with") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_shares" ADD CONSTRAINT "report_shares_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE IF NOT EXISTS "report_share_tokens" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "generated_report_id" TEXT,
    "token" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "max_access" INTEGER,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_share_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "report_share_tokens_token_key" ON "report_share_tokens"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "report_share_tokens_token_idx" ON "report_share_tokens"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "report_share_tokens_report_id_idx" ON "report_share_tokens"("report_id");

-- AddForeignKey
ALTER TABLE "report_share_tokens" ADD CONSTRAINT "report_share_tokens_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "saved_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_share_tokens" ADD CONSTRAINT "report_share_tokens_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE IF NOT EXISTS "documents" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "r2_key" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "status" TEXT NOT NULL DEFAULT 'pending_upload',
    "manual_asset_id" TEXT,
    "account_id" TEXT,
    "csv_preview" JSONB,
    "csv_mapping" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "documents_r2_key_key" ON "documents"("r2_key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "documents_space_id_status_idx" ON "documents"("space_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "documents_space_id_category_idx" ON "documents"("space_id", "category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "documents_space_id_created_at_idx" ON "documents"("space_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "documents_uploaded_by_idx" ON "documents"("uploaded_by");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
