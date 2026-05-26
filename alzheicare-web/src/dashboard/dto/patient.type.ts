import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PatientTypeObject {
  @Field(() => ID)
  id!: number;

  @Field(() => Int)
  userId!: number;

  @Field(() => Int, { nullable: true })
  doctorId?: number;

  @Field({ nullable: true })
  dateOfBirth?: Date;

  @Field({ nullable: true })
  dateOfDiagnosis?: Date;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  caregiversNumbers?: string;

  @Field({ nullable: true })
  phoneNumber?: string;
}
