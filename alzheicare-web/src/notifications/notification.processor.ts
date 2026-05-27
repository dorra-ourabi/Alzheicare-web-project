import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationService } from './notification.service.js';
import { TelegramService } from '../telegram/telegram.service.js';
import {
  NOTIFICATION_JOB,
  NOTIFICATIONS_QUEUE,
} from './notifications.constant.js';

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger('NotificationProcessor');

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private telegramService: TelegramService,
  ) {
    super();
  }

  async process(job: Job<{ eventId: string }>) {
    this.logger.log(`[Worker] Demarrage du traitement du job ${job.id}`);

    if (job.name !== NOTIFICATION_JOB) {
      return;
    }

    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: job.data.eventId },
      include: { user: true },
    });

    if (!event) {
      this.logger.warn(
        `Event ${job.data.eventId} not found for notification job`,
      );
      return;
    }

    if (event.notificationSent) {
      this.logger.debug(`Notification already sent for event ${event.id}`);
      return;
    }

    if (!event.user) {
      this.logger.warn(`Event ${event.id} has no user`);
      return;
    }

    try {
      if (!event.user.email) {
        this.logger.warn(`Event ${event.id} has no user email`);
      } else {
        await this.notificationService.sendReminder(event, event.user.email);
      }

      await this.prisma.calendarEvent.update({
        where: { id: event.id },
        data: { notificationSent: true },
      });
      await this.notificationService.createNotification(
        event.userId,
        'CALENDAR_REMINDER',
        `Reminder: ${event.title}`,
        `Starts at ${event.startTime.toLocaleString()}.`,
        undefined,
        'calendarEvent',
      );
      this.logger.log(`Notification sent for event ${event.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process reminder for event ${event.id}: ${this.errorMessage(error)}`,
      );
    }

    try {
      if (event.user.telegramChatId) {
        this.logger.log(
          `[Worker] Envoi du message Telegram au chat ${event.user.telegramChatId}`,
        );
        const message = `Reminder: ${event.title}\nStarts at: ${event.startTime.toLocaleString()}`;
        await this.telegramService.sendMessage(
          event.user.telegramChatId,
          message,
        );
      } else {
        this.logger.warn(
          `[Worker] Aucun telegramChatId pour l'utilisateur ${event.user.id}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send Telegram reminder for event ${event.id}: ${this.errorMessage(error)}`,
      );
    }
  }

  private errorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
