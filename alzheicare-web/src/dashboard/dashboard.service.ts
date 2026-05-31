import { ForbiddenException, Injectable } from '@nestjs/common';
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

export type DoctorDashboardMessage = {
  id: number;
  sender: 'doctor' | 'caregiver';
  text: string;
  time: string;
};

export type DoctorDashboardThread = {
  id: number;
  conversationId: number;
  patientId: number;
  name: string;
  caregiver: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  phase: 'Early' | 'Moderate' | 'Severe';
  messages: DoctorDashboardMessage[];
};

export type DoctorDashboardOverview = {
  doctor: {
    id: number;
    firstName: string;
    secondName: string;
    username: string;
    email: string;
    specialization: string | null;
    licenceNumber: string | null;
  };
  stats: {
    activePatients: number;
    unreadMessages: number;
    todaysAppointments: number;
    pendingReviews: number;
  };
  threads: DoctorDashboardThread[];
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // Aggregates a doctor overview for the frontend dashboard
  async getDoctorOverview(userId: number): Promise<DoctorDashboardOverview> {
    const doctorProfile = await this.prisma.doctor.findUnique({
      where: { userId },
      include: {
        user: true,
        patients: {
          include: {
            user: true,
            chronicDiseases: { orderBy: { diagnosisDate: 'desc' }, take: 1 },
            dailyLogs: {
              include: { moodEntry: true, behaviorEntries: true },
              orderBy: { date: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!doctorProfile) throw new ForbiddenException('Doctor profile not found');

    // conversations + today's appointments
    const [conversations, appointments] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { doctorId: doctorProfile.id },
        include: {
          patient: {
            include: {
              user: true,
              chronicDiseases: { orderBy: { diagnosisDate: 'desc' }, take: 1 },
              dailyLogs: { include: { moodEntry: true, behaviorEntries: true }, orderBy: { date: 'desc' }, take: 1 },
            },
          },
          messages: { orderBy: { sentAt: 'asc' } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.calendarEvent.findMany({
        where: {
          userId,
          category: 'appointment',
          startTime: { gte: this.startOfDay(), lt: this.startOfNextDay() },
        },
      }),
    ]);

    const threads = conversations.map((conversation) => {
      const patientUser = conversation.patient.user;
      const latestMessage = conversation.messages.at(-1);
      const unread = conversation.messages.filter((m) => m.senderId !== userId && m.readAt === null).length;

      return {
        id: conversation.id,
        conversationId: conversation.id,
        patientId: conversation.patientId,
        name: `${patientUser.firstName} ${patientUser.secondName}`,
        caregiver: conversation.patient.caregiversNumbers ?? 'Assigned caregiver',
        avatar: this.makeAvatar(patientUser.firstName, patientUser.secondName),
        lastMessage: latestMessage?.content ?? 'No messages yet',
        time: latestMessage ? this.formatTime(latestMessage.sentAt) : '—',
        unread,
        phase: this.derivePhase(conversation.patient),
        messages: conversation.messages.map((message) => ({
          id: message.id,
          sender: message.senderId === userId ? 'doctor' : 'caregiver',
          text: message.content,
          time: this.formatTime(message.sentAt),
        })),
      } as DoctorDashboardThread;
    });

    const unreadMessages = conversations.reduce((acc, c) => acc + c.messages.filter((m) => m.senderId !== userId && m.readAt === null).length, 0);

    const pendingReviews = doctorProfile.patients.filter((patient) => {
      const latestLog = patient.dailyLogs?.[0];
      const latestMood = latestLog?.moodEntry?.mood;
      const behaviorCount = latestLog?.behaviorEntries?.length ?? 0;
      return latestMood === 'sad' || latestMood === 'anxious' || behaviorCount > 0;
    }).length;

    return {
      doctor: {
        id: doctorProfile.id,
        firstName: doctorProfile.user.firstName,
        secondName: doctorProfile.user.secondName,
        username: doctorProfile.user.username,
        email: doctorProfile.user.email,
        specialization: doctorProfile.specialization,
        licenceNumber: doctorProfile.licenceNumber,
      },
      stats: {
        activePatients: doctorProfile.patients.length,
        unreadMessages,
        todaysAppointments: appointments.length,
        pendingReviews,
      },
      threads: threads.length > 0 ? threads : this.buildFallbackThreads(doctorProfile.patients),
    };
  }

  // Existing dashboard helpers and CRUD methods (kept as before)
  async getChronicDiseases(patientId: number): Promise<ChronicDisease[]> {
    return await this.prisma.chronicDisease.findMany({ where: { patientId }, orderBy: { diagnosisDate: 'desc' } });
  }

  async createChronicDisease(data: CreateChronicDiseaseInput): Promise<ChronicDisease> {
    return await this.prisma.chronicDisease.create({ data });
  }

  async updateChronicDisease(data: UpdateChronicDiseaseInput): Promise<ChronicDisease> {
    const { id, ...rest } = data;
    return await this.prisma.chronicDisease.update({ where: { id }, data: rest });
  }

  async deleteChronicDisease(id: number): Promise<ChronicDisease> {
    return await this.prisma.chronicDisease.delete({ where: { id } });
  }

  async getMedicationsByPatient(patientId: number): Promise<Medication[]> {
    return await this.prisma.medication.findMany({ where: { patientId }, orderBy: { startDate: 'desc' } });
  }

  async createMedication(data: CreateMedicationInput): Promise<Medication> {
    return await this.prisma.medication.create({ data });
  }

  async updateMedication(data: UpdateMedicationInput): Promise<Medication> {
    const { id, ...rest } = data;
    return await this.prisma.medication.update({ where: { id }, data: rest });
  }

  async deleteMedication(id: number): Promise<Medication> {
    return await this.prisma.medication.delete({ where: { id } });
  }

  async createPatient(data: CreatePatientInput): Promise<Patient> {
    return await this.prisma.patient.create({ data });
  }

  async updatePatient(data: UpdatePatientInput): Promise<Patient> {
    const { id, ...rest } = data;
    return await this.prisma.patient.update({ where: { id }, data: rest });
  }

  async deletePatient(id: number): Promise<Patient> {
    return await this.prisma.patient.delete({ where: { id } });
  }

  async getPatientsByDoctor(doctorId: number): Promise<Patient[]> {
    return await this.prisma.patient.findMany({ where: { doctorId }, orderBy: { id: 'desc' } });
  }

  async createDailyLog(data: CreateDailyLogInput): Promise<DailyLog> {
    const { patientId, date, mood, moodNote, behaviors, weightKg, sleep } = data;
    const parsedDate = new Date(date);

    return await this.prisma.$transaction(async (tx: any) => {
      const dailyLog = await tx.dailyLog.upsert({ where: { patientId_date: { patientId, date: parsedDate } }, update: {}, create: { patientId, date: parsedDate } });

      await tx.moodEntry.upsert({ where: { dailyLogId: dailyLog.id }, update: { mood, notes: moodNote ?? null }, create: { patientId, dailyLogId: dailyLog.id, date: parsedDate, mood, notes: moodNote ?? null } });

      await tx.behaviorEntry.deleteMany({ where: { dailyLogId: dailyLog.id } });
      if (behaviors.length > 0) {
        await tx.behaviorEntry.createMany({ data: behaviors.map((behavior) => ({ patientId, dailyLogId: dailyLog.id, date: parsedDate, behavior })) });
      }

      if (weightKg !== undefined && weightKg !== null) {
        await tx.weightRecord.upsert({ where: { dailyLogId: dailyLog.id }, update: { weightKg }, create: { patientId, dailyLogId: dailyLog.id, date: parsedDate, weightKg } });
      }

      if (sleep) {
        await tx.sleepRecord.upsert({ where: { dailyLogId: dailyLog.id }, update: { hoursSlept: sleep.hoursSlept, quality: sleep.quality, bedTime: sleep.bedTime ?? null, wakeTime: sleep.wakeTime ?? null, notes: sleep.sleepNotes ?? null }, create: { patientId, dailyLogId: dailyLog.id, date: parsedDate, hoursSlept: sleep.hoursSlept, quality: sleep.quality, bedTime: sleep.bedTime ?? null, wakeTime: sleep.wakeTime ?? null, notes: sleep.sleepNotes ?? null } });
      }

      return tx.dailyLog.findUniqueOrThrow({ where: { id: dailyLog.id }, include: { moodEntry: true, behaviorEntries: true, weightRecord: true, sleepRecord: true } });
    });
  }
  async getPatientDashboard(userId: number) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      include: {
        user: true,
        chronicDiseases: { orderBy: { diagnosisDate: 'desc' } },
        medications: { orderBy: { startDate: 'desc' } },
        allergies: true,
        dailyLogs: {
          include: {
            moodEntry: true,
            behaviorEntries: true,
            weightRecord: true,
            sleepRecord: true,
          },
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!patient) throw new ForbiddenException('Patient profile not found');

    const patientIdentity = {
      firstName: patient.user.firstName,
      secondName: patient.user.secondName,
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.toISOString() : null,
      dateOfDiagnosis: patient.dateOfDiagnosis ? patient.dateOfDiagnosis.toISOString() : null,
      address: patient.address ?? null,
      caregiversNumbers: patient.caregiversNumbers ?? null,
    };

    const chronicDiseases = (patient.chronicDiseases || []).map((cd) => ({
      id: cd.id,
      diseaseName: cd.diseaseType,
      additionalDisease: cd.additionalDisease ?? null,
      diagnosedAt: cd.diagnosisDate ? cd.diagnosisDate.toISOString() : null,
    }));

    const medications = (patient.medications || []).map((m) => ({
      id: m.id,
      name: m.name,
      dosage: m.dosage ?? null,
      startDate: m.startDate.toISOString(),
      endDate: m.endDate ? m.endDate.toISOString() : null,
      notes: m.notes ?? null,
    }));

    const allergies = (patient.allergies || []).map((a) => a.name);

    const behaviorEntries = (patient.dailyLogs || []).map((dl) => {
      const dateStr = dl.date.toISOString();
      const counts: Record<string, number> = { aggressiveness: 0, withdrawal: 0, anxiety: 0, repetitive_acts: 0 };
      dl.behaviorEntries?.forEach((be) => {
        counts[be.behavior] = (counts[be.behavior] ?? 0) + 1;
      });
      return {
        date: dateStr,
        aggressiveness: counts.aggressiveness ?? 0,
        withdrawal: counts.withdrawal ?? 0,
        anxiety: counts.anxiety ?? 0,
        repetitive: counts.repetitive_acts ?? 0,
      };
    });

    const weightEntries = (patient.dailyLogs || [])
      .filter((dl) => dl.weightRecord)
      .map((dl) => ({ date: dl.date.toISOString(), weight: dl.weightRecord!.weightKg }));

    const moodEntries = (patient.dailyLogs || [])
      .map((dl) => {
        const me = dl.moodEntry;
        if (!me) return null;
        return {
          id: me.id,
          date: me.date.toISOString(),
          mood: me.mood,
          notes: me.notes ?? null,
          recordedAt: me.recordedAt.toISOString(),
        };
      })
      .filter((x) => x !== null) as Array<{
      id: number;
      date: string;
      mood: string;
      notes: string | null;
      recordedAt: string;
    }>;

    const sleepRecords = (patient.dailyLogs || [])
      .map((dl) => {
        const sr = dl.sleepRecord;
        if (!sr) return null;
        return {
          id: sr.id,
          date: sr.date.toISOString(),
          hoursSlept: sr.hoursSlept,
          quality: sr.quality,
          bedTime: sr.bedTime ?? null,
          wakeTime: sr.wakeTime ?? null,
          notes: sr.notes ?? null,
        };
      })
      .filter((x) => x !== null) as Array<{
      id: number;
      date: string;
      hoursSlept: number;
      quality: string;
      bedTime: string | null;
      wakeTime: string | null;
      notes: string | null;
    }>;

    return {
      patient: patientIdentity,
      chronicDiseases,
      medications,
      allergies,
      behaviorEntries,
      weightEntries,
      moodEntries,
      sleepRecords,
    };
  }

  async getMoodEntries(patientId: number): Promise<MoodEntry[]> {
    return await this.prisma.moodEntry.findMany({ where: { patientId }, orderBy: { date: 'desc' } });
  }

  async getBehaviorEntries(patientId: number): Promise<BehaviorEntry[]> {
    return await this.prisma.behaviorEntry.findMany({ where: { patientId }, orderBy: { date: 'desc' } });
  }

  async getWeightRecords(patientId: number): Promise<WeightRecord[]> {
    return await this.prisma.weightRecord.findMany({ where: { patientId }, orderBy: { date: 'desc' } });
  }

  async getSleepRecords(patientId: number): Promise<SleepRecord[]> {
    return await this.prisma.sleepRecord.findMany({ where: { patientId }, orderBy: { date: 'desc' } });
  }

  async updateMoodNote(entryId: number, note: string): Promise<MoodEntry> {
    return await this.prisma.moodEntry.update({ where: { id: entryId }, data: { notes: note } });
  }

  private derivePhase(patient: { chronicDiseases?: Array<{ diseaseType: string }>; dailyLogs?: Array<{ moodEntry: { mood: string } | null }> }): 'Early' | 'Moderate' | 'Severe' {
    const diseaseType = patient.chronicDiseases?.[0]?.diseaseType;
    if (diseaseType === 'Stroke') return 'Severe';
    if (diseaseType === 'HeartDisease' || diseaseType === 'Other') return 'Moderate';
    if (diseaseType === 'Diabetes' || diseaseType === 'Hypertension') return 'Early';

    const mood = patient.dailyLogs?.[0]?.moodEntry?.mood;
    if (mood === 'sad' || mood === 'anxious') return 'Moderate';
    return 'Early';
  }

  private makeAvatar(firstName: string, secondName: string) {
    return `${firstName?.[0] ?? ''}${secondName?.[0] ?? ''}`.toUpperCase() || 'PT';
  }

  private formatTime(date: Date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  private startOfDay() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private startOfNextDay() {
    const start = this.startOfDay();
    return new Date(start.getTime() + 24 * 60 * 60 * 1000);
  }

  private buildFallbackThreads(patients: Array<{ id: number; user: { firstName: string; secondName: string } }>): DoctorDashboardThread[] {
    return patients.slice(0, 3).map((patient, index) => ({
      id: patient.id,
      conversationId: patient.id,
      patientId: patient.id,
      name: `${patient.user.firstName} ${patient.user.secondName}`,
      caregiver: 'Assigned caregiver',
      avatar: this.makeAvatar(patient.user.firstName, patient.user.secondName),
      lastMessage: 'No conversation yet',
      time: '—',
      unread: 0,
      phase: index === 0 ? 'Moderate' : 'Early',
      messages: [],
    }));
  }
}
