-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('retirement', 'education', 'house_purchase', 'emergency_fund', 'legacy', 'travel', 'business', 'debt_payoff', 'other');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('active', 'paused', 'achieved', 'abandoned');

-- CreateTable: goals
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "GoalType" NOT NULL,
    "target_amount" DECIMAL(19,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "target_date" DATE NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "status" "GoalStatus" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable: goal_allocations
CREATE TABLE "goal_allocations" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: goals indexes
CREATE INDEX "goals_space_id_status_idx" ON "goals"("space_id", "status");
CREATE INDEX "goals_space_id_created_at_idx" ON "goals"("space_id", "created_at" DESC);

-- CreateIndex: goal_allocations indexes
CREATE INDEX "goal_allocations_goal_id_idx" ON "goal_allocations"("goal_id");
CREATE INDEX "goal_allocations_account_id_idx" ON "goal_allocations"("account_id");
CREATE UNIQUE INDEX "goal_allocations_goal_id_account_id_key" ON "goal_allocations"("goal_id", "account_id");

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_allocations" ADD CONSTRAINT "goal_allocations_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_allocations" ADD CONSTRAINT "goal_allocations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
