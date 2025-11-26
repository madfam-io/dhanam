-- Add Janua multi-provider billing fields to User table
-- Supports Conekta for MX, Polar for international billing

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "janua_customer_id" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "billing_provider" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country_code" TEXT;

-- Add unique constraint on janua_customer_id
CREATE UNIQUE INDEX IF NOT EXISTS "users_janua_customer_id_key" ON "users"("janua_customer_id");
