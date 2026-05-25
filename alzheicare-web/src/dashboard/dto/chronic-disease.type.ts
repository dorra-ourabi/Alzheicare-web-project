import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum ChronicDiseaseType {
  Hypertension = 'Hypertension',
  Diabetes = 'Diabetes',
  HeartDisease = 'HeartDisease',
  Stroke = 'Stroke',
  Other = 'Other',
}

registerEnumType(ChronicDiseaseType, {
  name: 'ChronicDiseaseType',
  description: 'Common chronic disease categories for patient dashboard',
});

@ObjectType()
export class ChronicDiseaseTypeObject {
  @Field(() => ID)
  id!: number;

  @Field(() => ChronicDiseaseType)
  diseaseType!: ChronicDiseaseType;

  @Field()
  diagnosisDate!: Date;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  additionalDisease?: string;
}
