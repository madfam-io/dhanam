-- CreateTable
CREATE TABLE "category_corrections" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "original_category_id" TEXT,
    "corrected_category_id" TEXT NOT NULL,
    "merchant_pattern" TEXT,
    "description_pattern" TEXT,
    "confidence" DECIMAL(3,2),
    "created_by" TEXT NOT NULL,
    "applied_to_future" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_corrections_space_id_merchant_pattern_idx" ON "category_corrections"("space_id", "merchant_pattern");

-- CreateIndex
CREATE INDEX "category_corrections_space_id_created_at_idx" ON "category_corrections"("space_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "category_corrections_corrected_category_id_idx" ON "category_corrections"("corrected_category_id");
