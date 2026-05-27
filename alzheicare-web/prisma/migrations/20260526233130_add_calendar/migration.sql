-- CreateEnum
CREATE TYPE "CalendarCategory" AS ENUM ('medicine', 'appointment', 'mundane');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleAccessToken" TEXT,
ADD COLUMN     "googleCalendarChannelExpiresAt" BIGINT,
ADD COLUMN     "googleCalendarChannelId" TEXT,
ADD COLUMN     "googleCalendarResourceId" TEXT,
ADD COLUMN     "googleCalendarSyncToken" TEXT,
ADD COLUMN     "googleRefreshToken" TEXT;

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "googleEventId" TEXT,
    "seriesId" TEXT,
    "notifyBefore" INTEGER NOT NULL DEFAULT 30,
    "category" "CalendarCategory" NOT NULL DEFAULT 'appointment',
    "repeatDaily" BOOLEAN NOT NULL DEFAULT false,
    "repeatUntil" TIMESTAMP(3),
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_idx" ON "CalendarEvent"("userId");

-- CreateIndex
CREATE INDEX "CalendarEvent_startTime_idx" ON "CalendarEvent"("startTime");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
