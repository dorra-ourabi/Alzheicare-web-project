-- CreateEnum
CREATE TYPE "ChronicDiseaseType" AS ENUM ('Hypertension', 'Diabetes', 'HeartDisease', 'Stroke', 'Other');

-- CreateTable
CREATE TABLE "ChronicDisease" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "diseaseType" "ChronicDiseaseType" NOT NULL,
    "diagnosisDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "additionalDisease" TEXT,

    CONSTRAINT "ChronicDisease_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChronicDisease" ADD CONSTRAINT "ChronicDisease_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
