-- CreateTable
CREATE TABLE "drip_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),

    CONSTRAINT "drip_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "drip_events_user_id_idx" ON "drip_events"("user_id");

-- CreateIndex
CREATE INDEX "drip_events_campaign_step_idx" ON "drip_events"("campaign", "step");

-- CreateIndex
CREATE UNIQUE INDEX "drip_events_user_id_campaign_step_key" ON "drip_events"("user_id", "campaign", "step");

-- AddForeignKey
ALTER TABLE "drip_events" ADD CONSTRAINT "drip_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
