import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { BehaviorType, MoodLevel, SleepQuality } from './daily-log.type.js';

@ObjectType()
export class PatientDashboardIdentityType {
  @Field()
  firstName!: string;

  @Field()
  secondName!: string;

  @Field({ nullable: true })
  dateOfBirth!: string | null;

  @Field({ nullable: true })
  dateOfDiagnosis!: string | null;

  @Field({ nullable: true })
  address!: string | null;

  @Field({ nullable: true })
  caregiversNumbers!: string | null;
}

@ObjectType()
export class PatientDashboardChronicDiseaseType {
  @Field(() => ID)
  id!: number;

  @Field()
  diseaseName!: string;

  @Field({ nullable: true })
  additionalDisease!: string | null;

  @Field({ nullable: true })
  diagnosedAt!: string | null;
}

@ObjectType()
export class PatientDashboardMedicationType {
  @Field(() => ID)
  id!: number;

  @Field()
  name!: string;

  @Field({ nullable: true })
  dosage!: string | null;

  @Field()
  startDate!: string;

  @Field({ nullable: true })
  endDate!: string | null;

  @Field({ nullable: true })
  notes!: string | null;
}

@ObjectType()
export class PatientDashboardBehaviorEntryType {
  @Field()
  date!: string;

  @Field(() => Int)
  aggressiveness!: number;

  @Field(() => Int)
  withdrawal!: number;

  @Field(() => Int)
  anxiety!: number;

  @Field(() => Int)
  repetitive!: number;
}

@ObjectType()
export class PatientDashboardWeightEntryType {
  @Field()
  date!: string;

  @Field(() => Float)
  weight!: number;
}

@ObjectType()
export class PatientDashboardMoodEntryType {
  @Field(() => ID)
  id!: number;

  @Field()
  date!: string;

  @Field(() => MoodLevel)
  mood!: MoodLevel;

  @Field({ nullable: true })
  notes!: string | null;

  @Field()
  recordedAt!: string;
}

@ObjectType()
export class PatientDashboardSleepRecordType {
  @Field(() => ID)
  id!: number;

  @Field()
  date!: string;

  @Field(() => Float)
  hoursSlept!: number;

  @Field(() => SleepQuality)
  quality!: SleepQuality;

  @Field({ nullable: true })
  bedTime!: string | null;

  @Field({ nullable: true })
  wakeTime!: string | null;

  @Field({ nullable: true })
  notes!: string | null;
}

@ObjectType()
export class PatientDashboardType {
  @Field(() => PatientDashboardIdentityType)
  patient!: PatientDashboardIdentityType;

  @Field(() => [PatientDashboardChronicDiseaseType])
  chronicDiseases!: PatientDashboardChronicDiseaseType[];

  @Field(() => [PatientDashboardMedicationType])
  medications!: PatientDashboardMedicationType[];

  @Field(() => [String])
  allergies!: string[];

  @Field(() => [PatientDashboardBehaviorEntryType])
  behaviorEntries!: PatientDashboardBehaviorEntryType[];

  @Field(() => [PatientDashboardWeightEntryType])
  weightEntries!: PatientDashboardWeightEntryType[];

  @Field(() => [PatientDashboardMoodEntryType])
  moodEntries!: PatientDashboardMoodEntryType[];

  @Field(() => [PatientDashboardSleepRecordType])
  sleepRecords!: PatientDashboardSleepRecordType[];
}