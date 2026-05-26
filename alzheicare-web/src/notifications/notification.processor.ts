import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationService } from './notification.service.js';
import { NOTIFICATION_JOB, NOTIFICATIONS_QUEUE } from './notifications.constant.js';

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger('NotificationProcessor');

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<{ eventId: string }>) {
    if (job.name !== NOTIFICATION_JOB) {
      return;
    }

    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: job.data.eventId },
      include: { user: true },
    });

    if (!event) {
      this.logger.warn(`Event ${job.data.eventId} not found for notification job`);
      return;
    }

    if (event.notificationSent) {
      this.logger.debug(`Notification already sent for event ${event.id}`);
      return;
    }

    if (!event.user?.email) {
      this.logger.warn(`Event ${event.id} has no user email`);
      return;
    }

    try {
      await this.notificationService.sendReminder(event, event.user.email);
      await this.prisma.calendarEvent.update({
        where: { id: event.id },
        data: { notificationSent: true },
      });
      this.logger.log(`Notification sent for event ${event.id}`);
    } catch (error) {
      this.logger.error(`Failed to send notification for event ${event.id}: ${this.errorMessage(error)}`);
      throw error;
    }
  }

  private errorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
