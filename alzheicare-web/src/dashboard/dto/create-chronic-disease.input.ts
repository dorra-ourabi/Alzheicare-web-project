import { Field, InputType, Int } from '@nestjs/graphql';
import { ChronicDiseaseType } from './chronic-disease.type.js';

@InputType()
export class CreateChronicDiseaseInput {
  @Field(() => Int)
  patientId!: number;

  @Field(() => ChronicDiseaseType)
  diseaseType!: ChronicDiseaseType;

  @Field()
  diagnosisDate!: Date;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  additionalDisease?: string;
}
