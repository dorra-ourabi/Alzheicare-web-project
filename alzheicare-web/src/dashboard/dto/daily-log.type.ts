import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum MoodLevel {
  sad = 'sad',
  anxious = 'anxious',
  neutral = 'neutral',
  good = 'good',
  great = 'great',
}

export enum BehaviorType {
  aggressiveness = 'aggressiveness',
  withdrawal = 'withdrawal',
  anxiety = 'anxiety',
  repetitive_acts = 'repetitive_acts',
}

export enum SleepQuality {
  Poor = 'Poor',
  Fair = 'Fair',
  Good = 'Good',
  Excellent = 'Excellent',
}

registerEnumType(MoodLevel, { name: 'MoodLevel' });
registerEnumType(BehaviorType, { name: 'BehaviorType' });
registerEnumType(SleepQuality, { name: 'SleepQuality' });

@ObjectType()
export class MoodEntryType {
  @Field(() => ID)
  id!: number;

  @Field()
  patientId!: number;

  @Field()
  date!: Date;

  @Field(() => MoodLevel)
  mood!: MoodLevel;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  recordedAt!: Date;
}

@ObjectType()
export class BehaviorEntryType {
  @Field(() => ID)
  id!: number;

  @Field()
  patientId!: number;

  @Field()
  date!: Date;

  @Field(() => BehaviorType)
  behavior!: BehaviorType;

  @Field()
  recordedAt!: Date;
}

@ObjectType()
export class WeightRecordType {
  @Field(() => ID)
  id!: number;

  @Field()
  patientId!: number;

  @Field()
  date!: Date;

  @Field()
  weightKg!: number;

  @Field()
  recordedAt!: Date;
}

@ObjectType()
export class SleepRecordType {
  @Field(() => ID)
  id!: number;

  @Field()
  patientId!: number;

  @Field()
  date!: Date;

  @Field()
  hoursSlept!: number;

  @Field(() => SleepQuality)
  quality!: SleepQuality;

  @Field({ nullable: true })
  bedTime?: string;

  @Field({ nullable: true })
  wakeTime?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  recordedAt!: Date;
}

@ObjectType()
export class DailyLogType {
  @Field(() => ID)
  id!: number;

  @Field()
  patientId!: number;

  @Field()
  date!: Date;

  @Field({ nullable: true })
  moodEntry?: MoodEntryType;

  @Field(() => [BehaviorEntryType])
  behaviorEntries!: BehaviorEntryType[];

  @Field({ nullable: true })
  weightRecord?: WeightRecordType;

  @Field({ nullable: true })
  sleepRecord?: SleepRecordType;

  @Field()
  createdAt!: Date;
}
