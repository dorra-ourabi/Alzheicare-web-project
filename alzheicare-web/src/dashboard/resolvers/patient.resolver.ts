import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { PatientTypeObject } from '../dto/patient.type.js';
import { DashboardService } from '../dashboard.service.js';

@Resolver(() => PatientTypeObject)
export class PatientResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => [PatientTypeObject], { name: 'patientsByDoctor' })
  async getPatientsByDoctor(
    @Args('doctorId', { type: () => Int }) doctorId: number,
  ) {
    return this.dashboardService.getPatientsByDoctor(doctorId);
  }
}
