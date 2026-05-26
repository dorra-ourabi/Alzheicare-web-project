import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateMedicationInput } from '../dto/create-medication.input.js';
import { MedicationTypeObject } from '../dto/medication.type.js';
import { UpdateMedicationInput } from '../dto/update-medication.input.js';
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

  @Mutation(() => MedicationTypeObject, { name: 'createMedication' })
  async createMedication(@Args('data') data: CreateMedicationInput) {
    return this.dashboardService.createMedication(data);
  }

  @Mutation(() => MedicationTypeObject, { name: 'updateMedication' })
  async updateMedication(@Args('data') data: UpdateMedicationInput) {
    return this.dashboardService.updateMedication(data);
  }

  @Mutation(() => MedicationTypeObject, { name: 'deleteMedication' })
  async deleteMedication(@Args('id', { type: () => Int }) id: number) {
    return this.dashboardService.deleteMedication(id);
  }
}
