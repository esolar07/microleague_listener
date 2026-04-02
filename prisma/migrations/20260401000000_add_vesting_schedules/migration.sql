-- Add stageId column to existing vesting_schedules table (created via db push, not migration)
ALTER TABLE "vesting_schedules" ADD COLUMN IF NOT EXISTS "stageId" INTEGER NOT NULL DEFAULT 0;
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "stageId" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "startTime" INTEGER NOT NULL,
    "cliff" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "releaseInterval" INTEGER NOT NULL,
    "claimed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contract" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vesting_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vesting_schedules_walletAddress_scheduleId_contract_key" ON "vesting_schedules"("walletAddress", "scheduleId", "contract");

-- CreateIndex
CREATE INDEX "vesting_schedules_walletAddress_idx" ON "vesting_schedules"("walletAddress");

-- AddForeignKey
ALTER TABLE "vesting_schedules" ADD CONSTRAINT "vesting_schedules_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "presale_users"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
