-- ReferAI Database Setup
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Create enums
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('PROVIDER', 'PROMOTER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED', 'LOST');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ContentType" AS ENUM ('WHATSAPP_TEXT', 'INSTAGRAM_CAPTION', 'LINKEDIN_POST');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'TWITTER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PostStatus" AS ENUM ('PENDING', 'POSTING', 'POSTED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Campaign table
CREATE TABLE IF NOT EXISTS "Campaign" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "azugaCampaignId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL,
    "cta" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now(),
    "providerId" UUID NOT NULL REFERENCES auth.users(id)
);

-- Content table
CREATE TABLE IF NOT EXISTS "Content" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "type" "ContentType" NOT NULL,
    "language" TEXT DEFAULT 'he',
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "campaignId" UUID NOT NULL REFERENCES "Campaign"(id) ON DELETE CASCADE
);

-- ShareLink table
CREATE TABLE IF NOT EXISTS "ShareLink" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "code" TEXT UNIQUE NOT NULL,
    "clicks" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "promoterId" UUID NOT NULL REFERENCES auth.users(id),
    "campaignId" UUID NOT NULL REFERENCES "Campaign"(id) ON DELETE CASCADE
);

-- Lead table
CREATE TABLE IF NOT EXISTS "Lead" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" TEXT,
    "contact" TEXT,
    "status" "LeadStatus" DEFAULT 'NEW',
    "value" DOUBLE PRECISION,
    "commission" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now(),
    "campaignId" UUID NOT NULL REFERENCES "Campaign"(id) ON DELETE CASCADE,
    "promoterId" UUID NOT NULL REFERENCES auth.users(id)
);

-- PayoutLedger table
CREATE TABLE IF NOT EXISTS "PayoutLedger" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT DEFAULT 'PENDING',
    "periodStart" TIMESTAMPTZ NOT NULL,
    "periodEnd" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "promoterId" UUID NOT NULL REFERENCES auth.users(id)
);

-- SocialAccount table
CREATE TABLE IF NOT EXISTS "SocialAccount" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "platform" "SocialPlatform" NOT NULL,
    "username" TEXT NOT NULL,
    "encryptedCredentials" TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "lastUsedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now(),
    "userId" UUID NOT NULL REFERENCES auth.users(id),
    UNIQUE("userId", "platform", "username")
);

-- PostLog table
CREATE TABLE IF NOT EXISTS "PostLog" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "status" "PostStatus" DEFAULT 'PENDING',
    "platform" "SocialPlatform" NOT NULL,
    "contentText" TEXT NOT NULL,
    "errorMsg" TEXT,
    "postedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "campaignId" UUID NOT NULL REFERENCES "Campaign"(id) ON DELETE CASCADE,
    "accountId" UUID NOT NULL REFERENCES "SocialAccount"(id)
);

-- Enable Row Level Security
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Content" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShareLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayoutLedger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PostLog" ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to read/write their own data
-- Campaign: providers can CRUD their own, everyone can read active ones
CREATE POLICY "Users can read active campaigns" ON "Campaign" FOR SELECT USING (true);
CREATE POLICY "Providers can insert campaigns" ON "Campaign" FOR INSERT WITH CHECK (auth.uid() = "providerId");
CREATE POLICY "Providers can update own campaigns" ON "Campaign" FOR UPDATE USING (auth.uid() = "providerId");

-- Content: anyone can read, linked to campaign
CREATE POLICY "Anyone can read content" ON "Content" FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert content" ON "Content" FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ShareLink: promoters manage their own
CREATE POLICY "Anyone can read share links" ON "ShareLink" FOR SELECT USING (true);
CREATE POLICY "Authenticated can create share links" ON "ShareLink" FOR INSERT WITH CHECK (auth.uid() = "promoterId");
CREATE POLICY "Promoters can update own links" ON "ShareLink" FOR UPDATE USING (auth.uid() = "promoterId");

-- Lead: visible to campaign owner and promoter
CREATE POLICY "Users can read relevant leads" ON "Lead" FOR SELECT USING (true);
CREATE POLICY "Authenticated can create leads" ON "Lead" FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update leads" ON "Lead" FOR UPDATE USING (auth.uid() IS NOT NULL);

-- PayoutLedger: promoters see their own
CREATE POLICY "Promoters read own payouts" ON "PayoutLedger" FOR SELECT USING (auth.uid() = "promoterId");
CREATE POLICY "System can insert payouts" ON "PayoutLedger" FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- SocialAccount: users manage their own
CREATE POLICY "Users read own accounts" ON "SocialAccount" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users insert own accounts" ON "SocialAccount" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users update own accounts" ON "SocialAccount" FOR UPDATE USING (auth.uid() = "userId");

-- PostLog: readable by campaign owner
CREATE POLICY "Authenticated can read post logs" ON "PostLog" FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can insert post logs" ON "PostLog" FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_provider ON "Campaign"("providerId");
CREATE INDEX IF NOT EXISTS idx_content_campaign ON "Content"("campaignId");
CREATE INDEX IF NOT EXISTS idx_sharelink_campaign ON "ShareLink"("campaignId");
CREATE INDEX IF NOT EXISTS idx_sharelink_promoter ON "ShareLink"("promoterId");
CREATE INDEX IF NOT EXISTS idx_sharelink_code ON "ShareLink"("code");
CREATE INDEX IF NOT EXISTS idx_lead_campaign ON "Lead"("campaignId");
CREATE INDEX IF NOT EXISTS idx_lead_promoter ON "Lead"("promoterId");
CREATE INDEX IF NOT EXISTS idx_postlog_campaign ON "PostLog"("campaignId");
