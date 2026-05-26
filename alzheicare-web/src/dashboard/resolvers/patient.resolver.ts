import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreatePatientInput } from '../dto/create-patient.input.js';
import { UpdatePatientInput } from '../dto/update-patient.input.js';
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

  @Mutation(() => PatientTypeObject, { name: 'createPatient' })
  async createPatient(@Args('data') data: CreatePatientInput) {
    return this.dashboardService.createPatient(data);
  }

  @Mutation(() => PatientTypeObject, { name: 'updatePatient' })
  async updatePatient(@Args('data') data: UpdatePatientInput) {
    return this.dashboardService.updatePatient(data);
  }

  @Mutation(() => PatientTypeObject, { name: 'deletePatient' })
  async deletePatient(@Args('id', { type: () => Int }) id: number) {
    return this.dashboardService.deletePatient(id);
  }
}
