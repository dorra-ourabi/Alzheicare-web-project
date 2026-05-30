import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../Decorators/currentUser.decorator.js';
import { Roles } from '../Decorators/roles.decorator.js';
import { RolesGuard } from '../auth/Guards/roles.guard.js';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';
import { UserRole } from '../../generated/prisma/client.js';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Doctor)
  @Get('doctor/overview')
  getDoctorOverview(@CurrentUser() user: { sub: number }) {
    return this.dashboardService.getDoctorOverview(user.sub);
  }
}