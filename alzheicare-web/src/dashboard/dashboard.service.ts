import { Injectable } from '@nestjs/common';
import type { ChronicDisease, Patient } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type Medication = {
  id: number;
  patientId: number;
  name: string;
  dosage?: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getChronicDiseases(patientId: number): Promise<ChronicDisease[]> {
    return await this.prisma.chronicDisease.findMany({
      where: { patientId },
      orderBy: { diagnosisDate: 'desc' },
    });
  }

  getMedicationsByPatient(patientId: number): Promise<Medication[]> {
    void patientId;
    // The Medication model is now in Prisma schema, but the Prisma client
    // must be regenerated and migrations applied before this query can be
    // implemented using `this.prisma.medication.findMany(...)`.
    return Promise.resolve([]);
  }

  async getPatientsByDoctor(doctorId: number): Promise<Patient[]> {
    return await this.prisma.patient.findMany({
      where: { doctorId },
      orderBy: { id: 'desc' },
    });
  }
}
