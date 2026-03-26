-- CreateEnum
CREATE TYPE "PresaleTxType" AS ENUM ('Blockchain', 'Wert', 'Crypto_Payment', 'Bank_Transfer', 'Other_Cryptos', 'Card_Payment', 'Buy', 'Claim');

-- CreateEnum
CREATE TYPE "BuyerStatus" AS ENUM ('Active', 'Inactive', 'All');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletAddress" TEXT,
    "email" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "profileImage" TEXT,
    "country" TEXT,
    "username" TEXT,
    "fullName" TEXT,
    "tokensPurchased" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "claimed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unclaimed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "joinDate" TIMESTAMP(3),
    "lastActivity" TIMESTAMP(3),
    "status" "BuyerStatus" NOT NULL DEFAULT 'Active',
    "referredById" TEXT,
    "referralEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "kycStatus" TEXT NOT NULL DEFAULT 'pending',
    "veriffSessionId" TEXT,
    "kycVerifiedAt" TIMESTAMP(3),
    "kycDeclinedReason" TEXT,
    "reputationScore" INTEGER NOT NULL DEFAULT 100,
    "reputationTier" TEXT NOT NULL DEFAULT 'Good',
    "reputationUpdatedAt" TIMESTAMP(3),
    "poolContributionScore" INTEGER NOT NULL DEFAULT 0,
    "kycScore" INTEGER NOT NULL DEFAULT 0,
    "stakingScore" INTEGER NOT NULL DEFAULT 0,
    "externalCreditScore" INTEGER NOT NULL DEFAULT 0,
    "stakedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stakingStartDate" TIMESTAMP(3),
    "externalCreditScoreValue" INTEGER,
    "externalCreditScoreUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presale_txs" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "contract" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT,
    "tokenAddress" TEXT NOT NULL,
    "type" "PresaleTxType" NOT NULL DEFAULT 'Crypto_Payment',
    "amount" DOUBLE PRECISION NOT NULL,
    "stage" INTEGER NOT NULL,
    "tokens" DOUBLE PRECISION NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "usdAmount" DOUBLE PRECISION NOT NULL,
    "quote" TEXT NOT NULL,
    "typeformId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presale_txs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listener_state" (
    "id" TEXT NOT NULL,
    "contract" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "blockHash" TEXT NOT NULL,
    "reorged" BOOLEAN NOT NULL DEFAULT false,
    "reorgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listener_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "failed_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "contract" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "error" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "failed_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_userId_key" ON "users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "presale_txs_txHash_key" ON "presale_txs"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "listener_state_eventId_key" ON "listener_state"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "failed_events_eventId_key" ON "failed_events"("eventId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presale_txs" ADD CONSTRAINT "presale_txs_address_fkey" FOREIGN KEY ("address") REFERENCES "users"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
