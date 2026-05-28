import { Args, Float, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DashboardService } from '../dashboard.service.js';
import {
  DailyLogType,
  MoodEntryType,
  WeightRecordType,
  SleepRecordType,
  BehaviorEntryType,
} from '../dto/daily-log.type.js';
import { CreateDailyLogInput } from '../dto/create-daily-log.input.js';

@Resolver(() => DailyLogType)
export class DailyLogResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Mutation(() => DailyLogType, { name: 'createDailyLog' })
  async createDailyLog(@Args('data') data: CreateDailyLogInput) {
    return this.dashboardService.createDailyLog(data);
  }

  @Query(() => [MoodEntryType], { name: 'moodEntries' })
  async getMoodEntries(
    @Args('patientId', { type: () => Int }) patientId: number,
  ) {
    return this.dashboardService.getMoodEntries(patientId);
  }

  @Query(() => [BehaviorEntryType], { name: 'behaviorEntries' })
  async getBehaviorEntries(
    @Args('patientId', { type: () => Int }) patientId: number,
  ) {
    return this.dashboardService.getBehaviorEntries(patientId);
  }

  @Query(() => [WeightRecordType], { name: 'weightRecords' })
  async getWeightRecords(
    @Args('patientId', { type: () => Int }) patientId: number,
  ) {
    return this.dashboardService.getWeightRecords(patientId);
  }

  @Query(() => [SleepRecordType], { name: 'sleepRecords' })
  async getSleepRecords(
    @Args('patientId', { type: () => Int }) patientId: number,
  ) {
    return this.dashboardService.getSleepRecords(patientId);
  }

  @Mutation(() => MoodEntryType, { name: 'updateMoodNote' })
  async updateMoodNote(
    @Args('entryId', { type: () => Int }) entryId: number,
    @Args('note') note: string,
  ) {
    return this.dashboardService.updateMoodNote(entryId, note);
  }
}
