import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { BehaviorType, MoodLevel, SleepQuality } from './daily-log.type.js';

@ObjectType()
export class PatientDashboardIdentityType {
  @Field()
  firstName!: string;

  @Field()
  secondName!: string;

  @Field(() => String, { nullable: true })
  dateOfBirth!: string | null;

  @Field(() => String, { nullable: true })
  dateOfDiagnosis!: string | null;

  @Field(() => String, { nullable: true })
  address!: string | null;

  @Field(() => String, { nullable: true })
  caregiversNumbers!: string | null;
}

@ObjectType()
export class PatientDashboardChronicDiseaseType {
  @Field(() => ID)
  id!: number;

  @Field()
  diseaseName!: string;

  @Field(() => String, { nullable: true })
  additionalDisease!: string | null;

  @Field(() => String, { nullable: true })
  diagnosedAt!: string | null;
}

@ObjectType()
export class PatientDashboardMedicationType {
  @Field(() => ID)
  id!: number;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  dosage!: string | null;

  @Field()
  startDate!: string;


  @Field(() => String, { nullable: true })
  endDate!: string | null;

  @Field(() => String, { nullable: true })
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

  @Field(() => String, { nullable: true })
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

  @Field(() => String, { nullable: true })
  bedTime!: string | null;

  @Field(() => String, { nullable: true })
  wakeTime!: string | null;

  @Field(() => String, { nullable: true })
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