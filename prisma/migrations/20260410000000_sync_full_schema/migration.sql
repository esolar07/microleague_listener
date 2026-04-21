-- ============================================================
-- Full schema sync: add all app models + presale_users table
-- ============================================================

-- CreateEnum (skip if already exists)
DO $$ BEGIN
  CREATE TYPE "SportType" AS ENUM ('basketball', 'baseball', 'football');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "BankTransferStatus" AS ENUM ('Pending', 'Verified', 'Rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Lookup / seed tables ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "UserType" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserType_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserType_name_key" ON "UserType"("name");

CREATE TABLE IF NOT EXISTS "WalletType" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WalletType_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "WalletType_name_key" ON "WalletType"("name");

CREATE TABLE IF NOT EXISTS "MatchupSource" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MatchupSource_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MatchupSource_name_key" ON "MatchupSource"("name");

CREATE TABLE IF NOT EXISTS "MatchupOutcome" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MatchupOutcome_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MatchupOutcome_name_key" ON "MatchupOutcome"("name");

CREATE TABLE IF NOT EXISTS "GameMode" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GameMode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "GameMode_name_key" ON "GameMode"("name");

-- ─── Sports ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Sports" (
    "id" SERIAL NOT NULL,
    "name" "SportType" NOT NULL,
    CONSTRAINT "Sports_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Sports_name_key" ON "Sports"("name");

-- ─── User / Auth ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "referralId" TEXT NOT NULL,
    "userTypeId" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralId_key" ON "User"("referralId");
CREATE INDEX IF NOT EXISTS "User_referralId_idx" ON "User"("referralId");
CREATE INDEX IF NOT EXISTS "User_userTypeId_idx" ON "User"("userTypeId");

CREATE TABLE IF NOT EXISTS "UserProfile" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "username" TEXT,
    "displayName" TEXT,
    "bio" TEXT,
    "avatar" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "notifications" BOOLEAN NOT NULL DEFAULT false,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,
    "twoFactor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_userId_key" ON "UserProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_email_key" ON "UserProfile"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_username_key" ON "UserProfile"("username");

CREATE TABLE IF NOT EXISTS "Wallet" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletTypeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Wallet_address_key" ON "Wallet"("address");
CREATE INDEX IF NOT EXISTS "Wallet_userId_idx" ON "Wallet"("userId");
CREATE INDEX IF NOT EXISTS "Wallet_walletTypeId_idx" ON "Wallet"("walletTypeId");
CREATE INDEX IF NOT EXISTS "Wallet_address_idx" ON "Wallet"("address");

CREATE TABLE IF NOT EXISTS "Referral" (
    "id" SERIAL NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "referrerUserId" TEXT NOT NULL,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Referral_referredUserId_key" ON "Referral"("referredUserId");
CREATE INDEX IF NOT EXISTS "Referral_referrerUserId_idx" ON "Referral"("referrerUserId");
CREATE INDEX IF NOT EXISTS "Referral_isProcessed_idx" ON "Referral"("isProcessed");

-- ─── presale_users (new table linking to User) ────────────────────────────────

CREATE TABLE IF NOT EXISTS "presale_users" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "userId" TEXT,
    "tokensPurchased" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "claimed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unclaimed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "joinDate" TIMESTAMP(3),
    "lastActivity" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "presale_users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "presale_users_walletAddress_key" ON "presale_users"("walletAddress");
CREATE INDEX IF NOT EXISTS "presale_users_userId_idx" ON "presale_users"("userId");

-- ─── EraComparison ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "EraComparison" (
    "id" SERIAL NOT NULL,
    "sport" "SportType" NOT NULL,
    "era1" TEXT NOT NULL,
    "era2" TEXT NOT NULL,
    "comparisonData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EraComparison_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "EraComparison_sport_era1_era2_key" ON "EraComparison"("sport", "era1", "era2");
CREATE INDEX IF NOT EXISTS "EraComparison_sport_idx" ON "EraComparison"("sport");
CREATE INDEX IF NOT EXISTS "EraComparison_era1_era2_idx" ON "EraComparison"("era1", "era2");

-- ─── ManagedSeason ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ManagedSeason" (
    "id" SERIAL NOT NULL,
    "sportId" INTEGER NOT NULL,
    "teamName" TEXT NOT NULL,
    "teamSeason" TEXT NOT NULL,
    "playingSeason" TEXT NOT NULL,
    "seasonName" TEXT NOT NULL,
    "seasonLength" INTEGER NOT NULL DEFAULT 6,
    "ruleSet" TEXT,
    "eraComparisonId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ManagedSeason_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ManagedSeason_sportId_idx" ON "ManagedSeason"("sportId");
CREATE INDEX IF NOT EXISTS "ManagedSeason_eraComparisonId_idx" ON "ManagedSeason"("eraComparisonId");

-- ─── MatchUp ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "MatchUp" (
    "id" SERIAL NOT NULL,
    "sportId" INTEGER NOT NULL,
    "homeTeamSeason" TEXT NOT NULL,
    "homeTeamName" TEXT NOT NULL,
    "awayTeamSeason" TEXT NOT NULL,
    "awayTeamName" TEXT NOT NULL,
    "matchUpResultId" INTEGER,
    "eraComparisonId" INTEGER,
    "ruleSet" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MatchUp_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MatchUp_matchUpResultId_key" ON "MatchUp"("matchUpResultId");
CREATE INDEX IF NOT EXISTS "MatchUp_sportId_idx" ON "MatchUp"("sportId");
CREATE INDEX IF NOT EXISTS "MatchUp_matchUpResultId_idx" ON "MatchUp"("matchUpResultId");
CREATE INDEX IF NOT EXISTS "MatchUp_eraComparisonId_idx" ON "MatchUp"("eraComparisonId");
CREATE INDEX IF NOT EXISTS "MatchUp_userId_idx" ON "MatchUp"("userId");

-- ─── MatchUpResult ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "MatchUpResult" (
    "id" SERIAL NOT NULL,
    "simulation" JSONB NOT NULL,
    "sourceId" INTEGER NOT NULL DEFAULT 1,
    "slug" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MatchUpResult_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MatchUpResult_slug_key" ON "MatchUpResult"("slug");
CREATE INDEX IF NOT EXISTS "MatchUpResult_sourceId_idx" ON "MatchUpResult"("sourceId");

-- ─── MatchupResultArticle ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "MatchupResultArticle" (
    "id" SERIAL NOT NULL,
    "matchupResultId" INTEGER NOT NULL,
    "matchupArticle" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MatchupResultArticle_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MatchupResultArticle_matchupResultId_idx" ON "MatchupResultArticle"("matchupResultId");

-- ─── SeasonMatchup ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "SeasonMatchup" (
    "id" SERIAL NOT NULL,
    "managedSeasonId" INTEGER NOT NULL,
    "gameNumber" INTEGER NOT NULL,
    "opponentTeamName" TEXT NOT NULL,
    "opponentTeamSeason" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "matchUpResultId" INTEGER,
    "userTeamScore" INTEGER,
    "opponentScore" INTEGER,
    "outcomeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SeasonMatchup_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SeasonMatchup_matchUpResultId_key" ON "SeasonMatchup"("matchUpResultId");
CREATE INDEX IF NOT EXISTS "SeasonMatchup_managedSeasonId_idx" ON "SeasonMatchup"("managedSeasonId");
CREATE INDEX IF NOT EXISTS "SeasonMatchup_matchUpResultId_idx" ON "SeasonMatchup"("matchUpResultId");
CREATE INDEX IF NOT EXISTS "SeasonMatchup_outcomeId_idx" ON "SeasonMatchup"("outcomeId");

-- ─── Tournament ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Tournament" (
    "id" SERIAL NOT NULL,
    "scenarioName" TEXT NOT NULL,
    "shareableSlug" TEXT NOT NULL,
    "sport" "SportType" NOT NULL,
    "numberOfTeams" INTEGER NOT NULL,
    "gameModeId" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'setup',
    "championTeamName" TEXT,
    "championTeamSeason" TEXT,
    "ruleSet" TEXT,
    "seoSlug" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Tournament_scenarioName_key" ON "Tournament"("scenarioName");
CREATE UNIQUE INDEX IF NOT EXISTS "Tournament_shareableSlug_key" ON "Tournament"("shareableSlug");
CREATE UNIQUE INDEX IF NOT EXISTS "Tournament_seoSlug_key" ON "Tournament"("seoSlug");
CREATE INDEX IF NOT EXISTS "Tournament_shareableSlug_idx" ON "Tournament"("shareableSlug");
CREATE INDEX IF NOT EXISTS "Tournament_sport_idx" ON "Tournament"("sport");
CREATE INDEX IF NOT EXISTS "Tournament_status_idx" ON "Tournament"("status");
CREATE INDEX IF NOT EXISTS "Tournament_userId_idx" ON "Tournament"("userId");
CREATE INDEX IF NOT EXISTS "Tournament_gameModeId_idx" ON "Tournament"("gameModeId");

-- ─── TournamentTeam ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "TournamentTeam" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "teamName" TEXT NOT NULL,
    "teamSeason" TEXT NOT NULL,
    "seedPosition" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TournamentTeam_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TournamentTeam_tournamentId_seedPosition_key" ON "TournamentTeam"("tournamentId", "seedPosition");
CREATE INDEX IF NOT EXISTS "TournamentTeam_tournamentId_idx" ON "TournamentTeam"("tournamentId");
CREATE INDEX IF NOT EXISTS "TournamentTeam_seedPosition_idx" ON "TournamentTeam"("seedPosition");

-- ─── TournamentMatchup ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "TournamentMatchup" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "matchNumber" INTEGER,
    "homeTeamId" INTEGER,
    "awayTeamId" INTEGER,
    "winnerId" INTEGER,
    "matchUpResultId" INTEGER,
    "advancesToMatchupId" INTEGER,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TournamentMatchup_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TournamentMatchup_matchUpResultId_key" ON "TournamentMatchup"("matchUpResultId");
CREATE INDEX IF NOT EXISTS "TournamentMatchup_tournamentId_idx" ON "TournamentMatchup"("tournamentId");
CREATE INDEX IF NOT EXISTS "TournamentMatchup_roundNumber_idx" ON "TournamentMatchup"("roundNumber");
CREATE INDEX IF NOT EXISTS "TournamentMatchup_homeTeamId_idx" ON "TournamentMatchup"("homeTeamId");
CREATE INDEX IF NOT EXISTS "TournamentMatchup_awayTeamId_idx" ON "TournamentMatchup"("awayTeamId");
CREATE INDEX IF NOT EXISTS "TournamentMatchup_winnerId_idx" ON "TournamentMatchup"("winnerId");
CREATE INDEX IF NOT EXISTS "TournamentMatchup_matchUpResultId_idx" ON "TournamentMatchup"("matchUpResultId");
CREATE INDEX IF NOT EXISTS "TournamentMatchup_advancesToMatchupId_idx" ON "TournamentMatchup"("advancesToMatchupId");

-- ─── UserPick ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "UserPick" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "pick" TEXT NOT NULL,
    "matchUpId" INTEGER,
    "tournamentMatchupId" INTEGER,
    "isCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserPick_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserPick_userId_matchUpId_key" ON "UserPick"("userId", "matchUpId");
CREATE UNIQUE INDEX IF NOT EXISTS "UserPick_userId_tournamentMatchupId_key" ON "UserPick"("userId", "tournamentMatchupId");
CREATE INDEX IF NOT EXISTS "UserPick_userId_idx" ON "UserPick"("userId");
CREATE INDEX IF NOT EXISTS "UserPick_matchUpId_idx" ON "UserPick"("matchUpId");
CREATE INDEX IF NOT EXISTS "UserPick_tournamentMatchupId_idx" ON "UserPick"("tournamentMatchupId");

-- ─── comments ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "comments" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchUpId" INTEGER,
    "tournamentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "comments_matchUpId_idx" ON "comments"("matchUpId");
CREATE INDEX IF NOT EXISTS "comments_tournamentId_idx" ON "comments"("tournamentId");

-- ─── Foreign Keys ─────────────────────────────────────────────────────────────

ALTER TABLE "User" ADD CONSTRAINT "User_userTypeId_fkey"
  FOREIGN KEY ("userTypeId") REFERENCES "UserType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_walletTypeId_fkey"
  FOREIGN KEY ("walletTypeId") REFERENCES "WalletType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey"
  FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerUserId_fkey"
  FOREIGN KEY ("referrerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "presale_users" ADD CONSTRAINT "presale_users_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ManagedSeason" ADD CONSTRAINT "ManagedSeason_sportId_fkey"
  FOREIGN KEY ("sportId") REFERENCES "Sports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ManagedSeason" ADD CONSTRAINT "ManagedSeason_eraComparisonId_fkey"
  FOREIGN KEY ("eraComparisonId") REFERENCES "EraComparison"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MatchUp" ADD CONSTRAINT "MatchUp_sportId_fkey"
  FOREIGN KEY ("sportId") REFERENCES "Sports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MatchUp" ADD CONSTRAINT "MatchUp_matchUpResultId_fkey"
  FOREIGN KEY ("matchUpResultId") REFERENCES "MatchUpResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MatchUp" ADD CONSTRAINT "MatchUp_eraComparisonId_fkey"
  FOREIGN KEY ("eraComparisonId") REFERENCES "EraComparison"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MatchUp" ADD CONSTRAINT "MatchUp_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MatchUpResult" ADD CONSTRAINT "MatchUpResult_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "MatchupSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MatchupResultArticle" ADD CONSTRAINT "MatchupResultArticle_matchupResultId_fkey"
  FOREIGN KEY ("matchupResultId") REFERENCES "MatchUpResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SeasonMatchup" ADD CONSTRAINT "SeasonMatchup_managedSeasonId_fkey"
  FOREIGN KEY ("managedSeasonId") REFERENCES "ManagedSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SeasonMatchup" ADD CONSTRAINT "SeasonMatchup_matchUpResultId_fkey"
  FOREIGN KEY ("matchUpResultId") REFERENCES "MatchUpResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SeasonMatchup" ADD CONSTRAINT "SeasonMatchup_outcomeId_fkey"
  FOREIGN KEY ("outcomeId") REFERENCES "MatchupOutcome"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_gameModeId_fkey"
  FOREIGN KEY ("gameModeId") REFERENCES "GameMode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TournamentTeam" ADD CONSTRAINT "TournamentTeam_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TournamentMatchup" ADD CONSTRAINT "TournamentMatchup_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TournamentMatchup" ADD CONSTRAINT "TournamentMatchup_homeTeamId_fkey"
  FOREIGN KEY ("homeTeamId") REFERENCES "TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TournamentMatchup" ADD CONSTRAINT "TournamentMatchup_awayTeamId_fkey"
  FOREIGN KEY ("awayTeamId") REFERENCES "TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TournamentMatchup" ADD CONSTRAINT "TournamentMatchup_winnerId_fkey"
  FOREIGN KEY ("winnerId") REFERENCES "TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TournamentMatchup" ADD CONSTRAINT "TournamentMatchup_matchUpResultId_fkey"
  FOREIGN KEY ("matchUpResultId") REFERENCES "MatchUpResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TournamentMatchup" ADD CONSTRAINT "TournamentMatchup_advancesToMatchupId_fkey"
  FOREIGN KEY ("advancesToMatchupId") REFERENCES "TournamentMatchup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserPick" ADD CONSTRAINT "UserPick_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPick" ADD CONSTRAINT "UserPick_matchUpId_fkey"
  FOREIGN KEY ("matchUpId") REFERENCES "MatchUp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPick" ADD CONSTRAINT "UserPick_tournamentMatchupId_fkey"
  FOREIGN KEY ("tournamentMatchupId") REFERENCES "TournamentMatchup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comments" ADD CONSTRAINT "comments_matchUpId_fkey"
  FOREIGN KEY ("matchUpId") REFERENCES "MatchUp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comments" ADD CONSTRAINT "comments_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
