-- CreateEnum: WillStatus
CREATE TYPE "WillStatus" AS ENUM ('draft', 'active', 'revoked', 'executed');

-- CreateEnum: AssetType
CREATE TYPE "AssetType" AS ENUM ('bank_account', 'investment_account', 'crypto_account', 'real_estate', 'business_interest', 'personal_property', 'other');

-- CreateTable: wills
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

-- CreateTable: beneficiary_designations
CREATE TABLE "beneficiary_designations" (
    "id" TEXT NOT NULL,
    "will_id" TEXT NOT NULL,
    "beneficiary_id" TEXT NOT NULL,
    "asset_type" "AssetType" NOT NULL,
    "asset_id" TEXT,
    "percentage" DECIMAL(5,2) NOT NULL,
    "conditions" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiary_designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: will_executors
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

-- CreateIndex: wills indexes
CREATE INDEX "wills_household_id_idx" ON "wills"("household_id");
CREATE INDEX "wills_status_idx" ON "wills"("status");

-- CreateIndex: beneficiary_designations indexes
CREATE INDEX "beneficiary_designations_will_id_idx" ON "beneficiary_designations"("will_id");
CREATE INDEX "beneficiary_designations_beneficiary_id_idx" ON "beneficiary_designations"("beneficiary_id");

-- CreateIndex: will_executors indexes
CREATE INDEX "will_executors_will_id_idx" ON "will_executors"("will_id");
CREATE INDEX "will_executors_executor_id_idx" ON "will_executors"("executor_id");

-- AddForeignKey: wills -> households
ALTER TABLE "wills" ADD CONSTRAINT "wills_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: beneficiary_designations -> wills
ALTER TABLE "beneficiary_designations" ADD CONSTRAINT "beneficiary_designations_will_id_fkey" FOREIGN KEY ("will_id") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: beneficiary_designations -> household_members
ALTER TABLE "beneficiary_designations" ADD CONSTRAINT "beneficiary_designations_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "household_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: will_executors -> wills
ALTER TABLE "will_executors" ADD CONSTRAINT "will_executors_will_id_fkey" FOREIGN KEY ("will_id") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: will_executors -> household_members
ALTER TABLE "will_executors" ADD CONSTRAINT "will_executors_executor_id_fkey" FOREIGN KEY ("executor_id") REFERENCES "household_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
