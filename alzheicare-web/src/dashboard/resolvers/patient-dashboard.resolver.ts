import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../Decorators/currentUser.decorator.js';
import { Roles } from '../../Decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../auth/Guards/jwt.guard.js';
import { RolesGuard } from '../../auth/Guards/roles.guard.js';
import { UserRole } from '../../../generated/prisma/client.js';
import { DashboardService } from '../dashboard.service.js';
import { PatientDashboardType } from '../dto/patient-dashboard.type.js';

@Resolver(() => PatientDashboardType)
export class PatientDashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Patient)
  @Query(() => PatientDashboardType, { name: 'patientDashboard' })
  getPatientDashboard(@CurrentUser() user: { sub: number }) {
    return this.dashboardService.getPatientDashboard(user.sub);
  }
}