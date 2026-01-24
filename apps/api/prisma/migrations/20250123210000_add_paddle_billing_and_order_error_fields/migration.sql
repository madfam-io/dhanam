-- AddPaddleBillingFields
-- Add Paddle billing support fields to users table

ALTER TABLE "users" ADD COLUMN "paddle_customer_id" TEXT;
ALTER TABLE "users" ADD COLUMN "paddle_subscription_id" TEXT;

-- Create unique indexes for Paddle IDs
CREATE UNIQUE INDEX "users_paddle_customer_id_key" ON "users"("paddle_customer_id");
CREATE UNIQUE INDEX "users_paddle_subscription_id_key" ON "users"("paddle_subscription_id");

-- AddOrderErrorFields
-- Add error tracking fields to transaction_orders table

ALTER TABLE "transaction_orders" ADD COLUMN "error_code" TEXT;
ALTER TABLE "transaction_orders" ADD COLUMN "error_message" TEXT;
