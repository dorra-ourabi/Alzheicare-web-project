import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MedicationTypeObject {
  @Field(() => ID)
  id!: number;

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
