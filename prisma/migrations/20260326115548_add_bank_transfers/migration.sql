-- CreateEnum
CREATE TYPE "BankTransferStatus" AS ENUM ('Pending', 'Verified', 'Rejected');

-- CreateTable
CREATE TABLE "bank_transfers" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "senderName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "transactionRef" TEXT NOT NULL,
    "paymentRef" TEXT NOT NULL,
    "submittedDate" TIMESTAMP(3) NOT NULL,
    "status" "BankTransferStatus" NOT NULL DEFAULT 'Pending',
    "proofUrl" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "verificationNote" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bank_transfers_transferId_key" ON "bank_transfers"("transferId");
