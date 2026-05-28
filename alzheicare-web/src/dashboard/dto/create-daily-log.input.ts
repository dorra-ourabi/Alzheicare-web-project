import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { BehaviorType, MoodLevel, SleepQuality } from './daily-log.type.js';

@InputType()
export class SleepInput {
  @Field(() => Float)
  hoursSlept!: number;

  @Field(() => SleepQuality)
  quality!: SleepQuality;

  @Field({ nullable: true })
  bedTime?: string;

  @Field({ nullable: true })
  wakeTime?: string;

  @Field({ nullable: true })
  sleepNotes?: string;
}

@InputType()
export class CreateDailyLogInput {
  @Field(() => Int)
  patientId!: number;

  @Field()
  date!: string;

  @Field(() => MoodLevel)
  mood!: MoodLevel;

  @Field({ nullable: true })
  moodNote?: string;

  @Field(() => [BehaviorType])
  behaviors!: BehaviorType[];

  @Field(() => Float, { nullable: true })
  weightKg?: number;

  @Field(() => SleepInput, { nullable: true })
  sleep?: SleepInput;
}
