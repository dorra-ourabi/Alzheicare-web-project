import { Injectable } from '@nestjs/common';
import type {
  BehaviorEntry,
  ChronicDisease,
  DailyLog,
  Medication,
  MoodEntry,
  Patient,
  SleepRecord,
  WeightRecord,
} from '../../generated/prisma/client.js';
import type { CreateMedicationInput } from './dto/create-medication.input.js';
import type { UpdateMedicationInput } from './dto/update-medication.input.js';
import type { CreatePatientInput } from './dto/create-patient.input.js';
import type { UpdatePatientInput } from './dto/update-patient.input.js';
import type { CreateChronicDiseaseInput } from './dto/create-chronic-disease.input.js';
import type { UpdateChronicDiseaseInput } from './dto/update-chronic-disease.input.js';
import type { CreateDailyLogInput } from './dto/create-daily-log.input.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getChronicDiseases(patientId: number): Promise<ChronicDisease[]> {
    return await this.prisma.chronicDisease.findMany({
      where: { patientId },
      orderBy: { diagnosisDate: 'desc' },
    });
  }

  async createChronicDisease(
    data: CreateChronicDiseaseInput,
  ): Promise<ChronicDisease> {
    return await this.prisma.chronicDisease.create({
      data,
    });
  }

  async updateChronicDisease(
    data: UpdateChronicDiseaseInput,
  ): Promise<ChronicDisease> {
    const { id, ...rest } = data;
    return await this.prisma.chronicDisease.update({
      where: { id },
      data: rest,
    });
  }

  async deleteChronicDisease(id: number): Promise<ChronicDisease> {
    return await this.prisma.chronicDisease.delete({
      where: { id },
    });
  }

  async getMedicationsByPatient(patientId: number): Promise<Medication[]> {
    return await this.prisma.medication.findMany({
      where: { patientId },
      orderBy: { startDate: 'desc' },
    });
  }

  async createMedication(data: CreateMedicationInput): Promise<Medication> {
    return await this.prisma.medication.create({
      data,
    });
  }

  async updateMedication(data: UpdateMedicationInput): Promise<Medication> {
    const { id, ...rest } = data;
    return await this.prisma.medication.update({
      where: { id },
      data: rest,
    });
  }

  async deleteMedication(id: number): Promise<Medication> {
    return await this.prisma.medication.delete({
      where: { id },
    });
  }

  async createPatient(data: CreatePatientInput): Promise<Patient> {
    return await this.prisma.patient.create({
      data,
    });
  }

  async updatePatient(data: UpdatePatientInput): Promise<Patient> {
    const { id, ...rest } = data;
    return await this.prisma.patient.update({
      where: { id },
      data: rest,
    });
  }

  async deletePatient(id: number): Promise<Patient> {
    return await this.prisma.patient.delete({
      where: { id },
    });
  }

  async getPatientsByDoctor(doctorId: number): Promise<Patient[]> {
    return await this.prisma.patient.findMany({
      where: { doctorId },
      orderBy: { id: 'desc' },
    });
  }

async createDailyLog(data: CreateDailyLogInput): Promise<DailyLog> {
    const { patientId, date, mood, moodNote, behaviors, weightKg, sleep } =
      data;

    const parsedDate = new Date(date);

    return await this.prisma.$transaction(async (tx) => {
      const dailyLog = await tx.dailyLog.upsert({
        where: { patientId_date: { patientId, date: parsedDate } },
        update: {},
        create: { patientId, date: parsedDate },
      });

      await tx.moodEntry.upsert({
        where: { dailyLogId: dailyLog.id },
        update: { mood, notes: moodNote ?? null },
        create: {
          patientId,
          dailyLogId: dailyLog.id,
          date: parsedDate,
          mood,
          notes: moodNote ?? null,
        },
      });

      await tx.behaviorEntry.deleteMany({ where: { dailyLogId: dailyLog.id } });
      if (behaviors.length > 0) {
        await tx.behaviorEntry.createMany({
          data: behaviors.map((behavior) => ({
            patientId,
            dailyLogId: dailyLog.id,
            date: parsedDate,
            behavior,
          })),
        });
      }

      if (weightKg !== undefined && weightKg !== null) {
        await tx.weightRecord.upsert({
          where: { dailyLogId: dailyLog.id },
          update: { weightKg },
          create: {
            patientId,
            dailyLogId: dailyLog.id,
            date: parsedDate,
            weightKg,
          },
        });
      }

      if (sleep) {
        await tx.sleepRecord.upsert({
          where: { dailyLogId: dailyLog.id },
          update: {
            hoursSlept: sleep.hoursSlept,
            quality: sleep.quality,
            bedTime: sleep.bedTime ?? null,
            wakeTime: sleep.wakeTime ?? null,
            notes: sleep.sleepNotes ?? null,
          },
          create: {
            patientId,
            dailyLogId: dailyLog.id,
            date: parsedDate,
            hoursSlept: sleep.hoursSlept,
            quality: sleep.quality,
            bedTime: sleep.bedTime ?? null,
            wakeTime: sleep.wakeTime ?? null,
            notes: sleep.sleepNotes ?? null,
          },
        });
      }

      return tx.dailyLog.findUniqueOrThrow({
        where: { id: dailyLog.id },
        include: {
          moodEntry: true,
          behaviorEntries: true,
          weightRecord: true,
          sleepRecord: true,
        },
      });
    });
  }

  async getMoodEntries(patientId: number): Promise<MoodEntry[]> {
    return await this.prisma.moodEntry.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
    });
  }

  async getBehaviorEntries(patientId: number): Promise<BehaviorEntry[]> {
    return await this.prisma.behaviorEntry.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
    });
  }

  async getWeightRecords(patientId: number): Promise<WeightRecord[]> {
    return await this.prisma.weightRecord.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
    });
  }

  async getSleepRecords(patientId: number): Promise<SleepRecord[]> {
    return await this.prisma.sleepRecord.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
    });
  }

  async updateMoodNote(entryId: number, note: string): Promise<MoodEntry> {
    return await this.prisma.moodEntry.update({
      where: { id: entryId },
      data: { notes: note },
    });
  }
}