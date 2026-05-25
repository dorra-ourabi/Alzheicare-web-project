import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { ChronicDiseaseTypeObject } from '../dto/chronic-disease.type.js';
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
}
