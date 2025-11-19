-- CreateEnum: HouseholdType
CREATE TYPE "HouseholdType" AS ENUM ('family', 'trust', 'estate', 'partnership');

-- CreateEnum: RelationshipType
CREATE TYPE "RelationshipType" AS ENUM ('spouse', 'partner', 'child', 'parent', 'sibling', 'grandparent', 'grandchild', 'dependent', 'trustee', 'beneficiary', 'other');

-- AlterTable: users
ALTER TABLE "users" ADD COLUMN "date_of_birth" DATE;

-- AlterTable: spaces
ALTER TABLE "spaces" ADD COLUMN "household_id" TEXT;

-- AlterTable: goals
ALTER TABLE "goals" ADD COLUMN "household_id" TEXT;

-- CreateTable: households
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "HouseholdType" NOT NULL DEFAULT 'family',
    "base_currency" "Currency" NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable: household_members
CREATE TABLE "household_members" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "relationship" "RelationshipType" NOT NULL,
    "is_minor" BOOLEAN NOT NULL DEFAULT false,
    "access_start_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: households indexes
CREATE INDEX "households_created_at_idx" ON "households"("created_at");

-- CreateIndex: household_members indexes
CREATE INDEX "household_members_household_id_idx" ON "household_members"("household_id");
CREATE INDEX "household_members_user_id_idx" ON "household_members"("user_id");
CREATE UNIQUE INDEX "household_members_household_id_user_id_key" ON "household_members"("household_id", "user_id");

-- CreateIndex: spaces household_id index
CREATE INDEX "spaces_household_id_idx" ON "spaces"("household_id");

-- CreateIndex: goals household_id index
CREATE INDEX "goals_household_id_idx" ON "goals"("household_id");

-- AddForeignKey: spaces -> households
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: goals -> households
ALTER TABLE "goals" ADD CONSTRAINT "goals_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: household_members -> households
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: household_members -> users
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
