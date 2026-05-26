import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class UpdateMedicationInput {
  @Field(() => Int)
  id!: number;

  @Field(() => Int, { nullable: true })
  patientId?: number;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  dosage?: string;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field({ nullable: true })
  notes?: string;
}
