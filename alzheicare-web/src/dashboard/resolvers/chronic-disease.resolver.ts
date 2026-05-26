import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateChronicDiseaseInput } from '../dto/create-chronic-disease.input.js';
import { ChronicDiseaseTypeObject } from '../dto/chronic-disease.type.js';
import { UpdateChronicDiseaseInput } from '../dto/update-chronic-disease.input.js';
import { DashboardService } from '../dashboard.service.js';

@Resolver(() => ChronicDiseaseTypeObject)
export class ChronicDiseaseResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => [ChronicDiseaseTypeObject], { name: 'chronicDiseases' })
  async getChronicDiseases(
    @Args('patientId', { type: () => Int }) patientId: number,
  ) {
    return this.dashboardService.getChronicDiseases(patientId);
  }

  @Mutation(() => ChronicDiseaseTypeObject, { name: 'createChronicDisease' })
  async createChronicDisease(@Args('data') data: CreateChronicDiseaseInput) {
    return this.dashboardService.createChronicDisease(data);
  }

  @Mutation(() => ChronicDiseaseTypeObject, { name: 'updateChronicDisease' })
  async updateChronicDisease(@Args('data') data: UpdateChronicDiseaseInput) {
    return this.dashboardService.updateChronicDisease(data);
  }

  @Mutation(() => ChronicDiseaseTypeObject, { name: 'deleteChronicDisease' })
  async deleteChronicDisease(@Args('id', { type: () => Int }) id: number) {
    return this.dashboardService.deleteChronicDisease(id);
  }
}
