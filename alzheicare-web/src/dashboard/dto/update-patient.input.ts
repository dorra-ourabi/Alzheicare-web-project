import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class UpdatePatientInput {
  @Field(() => Int)
  id!: number;

  @Field(() => Int, { nullable: true })
  userId?: number;

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
