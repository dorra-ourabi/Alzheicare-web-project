import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { MedicationTypeObject } from '../dto/medication.type.js';
import { DashboardService } from '../dashboard.service.js';

@Resolver(() => MedicationTypeObject)
export class MedicationResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => [MedicationTypeObject], { name: 'medicationsByPatient' })
  async getMedicationsByPatient(
    @Args('patientId', { type: () => Int }) patientId: number,
  ) {
    return this.dashboardService.getMedicationsByPatient(patientId);
  }
}
