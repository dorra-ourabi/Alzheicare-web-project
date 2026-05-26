import { Field, InputType, Int } from '@nestjs/graphql';
import { ChronicDiseaseType } from './chronic-disease.type.js';

@InputType()
export class UpdateChronicDiseaseInput {
  @Field(() => Int)
  id!: number;

  @Field(() => Int, { nullable: true })
  patientId?: number;

  @Field(() => ChronicDiseaseType, { nullable: true })
  diseaseType?: ChronicDiseaseType;

  @Field({ nullable: true })
  diagnosisDate?: Date;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  additionalDisease?: string;
}
