-- AlterTable
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "googleAccessToken" TEXT,
ADD COLUMN IF NOT EXISTS "googleRefreshToken" TEXT,
ADD COLUMN IF NOT EXISTS "googleCalendarChannelId" TEXT,
ADD COLUMN IF NOT EXISTS "googleCalendarResourceId" TEXT,
ADD COLUMN IF NOT EXISTS "googleCalendarSyncToken" TEXT,
ADD COLUMN IF NOT EXISTS "googleCalendarChannelExpiresAt" BIGINT;
