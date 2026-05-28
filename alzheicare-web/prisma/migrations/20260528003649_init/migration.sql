-- CreateEnum
CREATE TYPE "MoodLevel" AS ENUM ('sad', 'anxious', 'neutral', 'good', 'great');

-- CreateEnum
CREATE TYPE "BehaviorType" AS ENUM ('aggressiveness', 'withdrawal', 'anxiety', 'repetitive_acts');

-- CreateEnum
CREATE TYPE "SleepQuality" AS ENUM ('Poor', 'Fair', 'Good', 'Excellent');

-- CreateTable
CREATE TABLE "allergies" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_logs" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_entries" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "dailyLogId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "mood" "MoodLevel" NOT NULL,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mood_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavior_entries" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "dailyLogId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "behavior" "BehaviorType" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "behavior_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_records" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "dailyLogId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sleep_records" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "dailyLogId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "hoursSlept" DOUBLE PRECISION NOT NULL,
    "quality" "SleepQuality" NOT NULL,
    "bedTime" TEXT,
    "wakeTime" TEXT,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sleep_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_logs_patientId_date_key" ON "daily_logs"("patientId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "mood_entries_dailyLogId_key" ON "mood_entries"("dailyLogId");

-- CreateIndex
CREATE UNIQUE INDEX "weight_records_dailyLogId_key" ON "weight_records"("dailyLogId");

-- CreateIndex
CREATE UNIQUE INDEX "sleep_records_dailyLogId_key" ON "sleep_records"("dailyLogId");

-- AddForeignKey
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "daily_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_entries" ADD CONSTRAINT "behavior_entries_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_entries" ADD CONSTRAINT "behavior_entries_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "daily_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_records" ADD CONSTRAINT "weight_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_records" ADD CONSTRAINT "weight_records_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "daily_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sleep_records" ADD CONSTRAINT "sleep_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sleep_records" ADD CONSTRAINT "sleep_records_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "daily_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
