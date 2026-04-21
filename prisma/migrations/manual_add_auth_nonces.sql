-- Create the auth_nonces table for wallet signature authentication
CREATE TABLE IF NOT EXISTS "auth_nonces" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_nonces_pkey" PRIMARY KEY ("id")
);

-- Create unique index on walletAddress
CREATE UNIQUE INDEX IF NOT EXISTS "auth_nonces_walletAddress_key" ON "auth_nonces"("walletAddress");
