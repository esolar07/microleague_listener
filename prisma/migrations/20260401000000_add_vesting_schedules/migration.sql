-- CreateTable (idempotent — table may already exist from db push)
CREATE TABLE IF NOT EXISTS "vesting_schedules" (
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

-- AddColumn (idempotent)
DO $$ BEGIN
    ALTER TABLE "vesting_schedules" ADD COLUMN "stageId" INTEGER NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "vesting_schedules_walletAddress_scheduleId_contract_key" ON "vesting_schedules"("walletAddress", "scheduleId", "contract");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "vesting_schedules_walletAddress_idx" ON "vesting_schedules"("walletAddress");

-- AddForeignKey (skip if presale_users table does not exist)
DO $$ BEGIN
    ALTER TABLE "vesting_schedules" ADD CONSTRAINT "vesting_schedules_walletAddress_fkey"
        FOREIGN KEY ("walletAddress") REFERENCES "presale_users"("walletAddress")
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN undefined_table OR duplicate_object THEN NULL;
END $$;
