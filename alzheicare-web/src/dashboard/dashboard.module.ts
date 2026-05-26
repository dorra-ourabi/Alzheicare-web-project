import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { DashboardService } from './dashboard.service.js';
import { ChronicDiseaseResolver } from './resolvers/chronic-disease.resolver.js';
import { MedicationResolver } from './resolvers/medication.resolver.js';
import { PatientResolver } from './resolvers/patient.resolver.js';

@Module({
  imports: [PrismaModule],
  providers: [
    DashboardService,
    ChronicDiseaseResolver,
    MedicationResolver,
    PatientResolver,
  ],
})
export class DashboardModule {}
