-- RFC 0011 — FX as a platform service (Phase 1)
-- Additive only. The legacy `exchange_rates` table is preserved.

-- CreateTable
CREATE TABLE "fx_rate_observations" (
    "id" TEXT NOT NULL,
    "from_currency" TEXT NOT NULL,
    "to_currency" TEXT NOT NULL,
    "rate_type" TEXT NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "source" TEXT NOT NULL,
    "provider_id" TEXT,
    "payment_id" TEXT,
    "observed_at" TIMESTAMP(3) NOT NULL,
    "effective_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fx_rate_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fx_rate_publications" (
    "id" TEXT NOT NULL,
    "from_currency" TEXT NOT NULL,
    "to_currency" TEXT NOT NULL,
    "effective_date" DATE NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "source" TEXT NOT NULL,
    "provider_id" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fx_rate_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fx_rate_overrides" (
    "id" TEXT NOT NULL,
    "from_currency" TEXT NOT NULL,
    "to_currency" TEXT NOT NULL,
    "rate_type" TEXT NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "rationale" TEXT NOT NULL,
    "issued_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoked_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fx_rate_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fx_rate_observations_from_currency_to_currency_rate_type_eff_idx"
    ON "fx_rate_observations"("from_currency", "to_currency", "rate_type", "effective_at" DESC);

-- CreateIndex
CREATE INDEX "fx_rate_observations_from_currency_to_currency_rate_type_obs_idx"
    ON "fx_rate_observations"("from_currency", "to_currency", "rate_type", "observed_at" DESC);

-- CreateIndex
CREATE INDEX "fx_rate_observations_payment_id_idx" ON "fx_rate_observations"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "fx_rate_publications_from_currency_to_currency_effective_dat_key"
    ON "fx_rate_publications"("from_currency", "to_currency", "effective_date");

-- CreateIndex
CREATE INDEX "fx_rate_publications_from_currency_to_currency_effective_dat_idx"
    ON "fx_rate_publications"("from_currency", "to_currency", "effective_date" DESC);

-- CreateIndex
CREATE INDEX "fx_rate_overrides_from_currency_to_currency_rate_type_expire_idx"
    ON "fx_rate_overrides"("from_currency", "to_currency", "rate_type", "expires_at");

-- CreateIndex
CREATE INDEX "fx_rate_overrides_revoked_at_idx" ON "fx_rate_overrides"("revoked_at");
