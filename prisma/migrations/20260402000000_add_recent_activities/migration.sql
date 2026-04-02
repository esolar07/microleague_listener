-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('Buy', 'Claim', 'Vesting_Created');

-- CreateTable
CREATE TABLE "recent_activities" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "usdAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "txHash" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recent_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recent_activities_walletAddress_idx" ON "recent_activities"("walletAddress");

-- CreateIndex
CREATE INDEX "recent_activities_timestamp_idx" ON "recent_activities"("timestamp");
