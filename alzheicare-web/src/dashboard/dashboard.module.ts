import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { DashboardService } from './dashboard.service.js';
import { ChronicDiseaseResolver } from './resolvers/chronic-disease.resolver.js';

@Module({
  imports: [PrismaModule],
  providers: [DashboardService, ChronicDiseaseResolver],
})
export class DashboardModule {}
