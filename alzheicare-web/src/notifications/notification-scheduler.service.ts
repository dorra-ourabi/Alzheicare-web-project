import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { CalendarEvent } from '../../generated/prisma/client.js';
import { NOTIFICATION_JOB, NOTIFICATIONS_QUEUE } from './notifications.constant.js';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger('NotificationSchedulerService');

  constructor(@InjectQueue(NOTIFICATIONS_QUEUE) private queue: Queue) {}

  async scheduleEventNotification(event: CalendarEvent) {
    if (event.notificationSent) {
      return;
    }

    const delayMs = this.computeDelayMs(event);
    if (delayMs === null) {
      return;
    }

    await this.queue.add(
      NOTIFICATION_JOB,
      { eventId: event.id },
      {
        jobId: event.id,
        delay: delayMs,
        attempts: 3,
        backoff: { type: 'exponential', delay: 30000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    );

    this.logger.debug(`Scheduled notification job for event ${event.id} in ${delayMs}ms`);
  }

  async rescheduleEventNotification(event: CalendarEvent) {
    await this.cancelEventNotification(event.id);
    await this.scheduleEventNotification(event);
  }

  async cancelEventNotification(eventId: string) {
    try {
      await this.queue.remove(eventId);
      this.logger.debug(`Cancelled notification job for event ${eventId}`);
    } catch (error) {
      this.logger.warn(`Failed to cancel notification job for event ${eventId}: ${this.errorMessage(error)}`);
    }
  }

  private computeDelayMs(event: CalendarEvent) {
    const now = Date.now();
    const startTimeMs = event.startTime.getTime();

    if (Number.isNaN(startTimeMs) || startTimeMs <= now) {
      return null;
    }

    const notifyBeforeMinutes = event.notifyBefore ?? 30;
    const notifyAtMs = startTimeMs - notifyBeforeMinutes * 60 * 1000;
    const delayMs = Math.max(notifyAtMs - now, 0);

    return delayMs;
  }

  private errorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
