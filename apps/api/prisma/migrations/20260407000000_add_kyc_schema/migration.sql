-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "identity_verifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kyc_status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "provider_flow_id" TEXT,
    "pep_match" BOOLEAN NOT NULL DEFAULT false,
    "sanctions_match" BOOLEAN NOT NULL DEFAULT false,
    "curp_validated" BOOLEAN NOT NULL DEFAULT false,
    "ine_validated" BOOLEAN NOT NULL DEFAULT false,
    "verification_data" JSONB,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identity_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_documents" (
    "id" TEXT NOT NULL,
    "verification_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "identity_verifications_user_id_idx" ON "identity_verifications"("user_id");

-- CreateIndex
CREATE INDEX "identity_verifications_kyc_status_idx" ON "identity_verifications"("kyc_status");

-- CreateIndex
CREATE INDEX "identity_verifications_provider_flow_id_idx" ON "identity_verifications"("provider_flow_id");

-- CreateIndex
CREATE INDEX "verification_documents_verification_id_idx" ON "verification_documents"("verification_id");

-- AddForeignKey
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_verification_id_fkey" FOREIGN KEY ("verification_id") REFERENCES "identity_verifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
