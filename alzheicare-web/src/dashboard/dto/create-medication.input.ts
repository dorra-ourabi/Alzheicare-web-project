import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateMedicationInput {
  @Field(() => Int)
  patientId!: number;

  @Field()
  name!: string;

  @Field({ nullable: true })
  dosage?: string;

  @Field()
  startDate!: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field({ nullable: true })
  notes?: string;
}
