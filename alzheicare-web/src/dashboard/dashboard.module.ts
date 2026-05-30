import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller.js';
import { ChronicDiseaseResolver } from './resolvers/chronic-disease.resolver.js';
import { MedicationResolver } from './resolvers/medication.resolver.js';
import { PatientResolver } from './resolvers/patient.resolver.js';
import { DailyLogResolver } from './resolvers/daily-log.resolver.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    ChronicDiseaseResolver,
    MedicationResolver,
    PatientResolver,
    DailyLogResolver,
  ],
})
export class DashboardModule {}
