import { Injectable } from '@nestjs/common';
import type { ChronicDisease } from '../../generated/prisma/client.js';
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
}
