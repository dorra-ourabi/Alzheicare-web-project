import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { EventEmitter } from 'events';
import { Observable, fromEvent, map } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CalendarEvent,
  Notification,
  NotificationType,
} from '../../generated/prisma/client.js';

type NotificationPayload = {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  body?: string | null;
  isRead: boolean;
  referenceId?: string | null;
  referenceType?: string | null;
  createdAt: string;
  readAt?: string | null;
};

type NotificationEvent = {
  type: 'notification:new';
  notification: NotificationPayload;
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger('NotificationService');
  private readonly eventEmitter = new EventEmitter();

  constructor(
    private mailerService: MailerService,
    private prisma: PrismaService,
  ) {}

  subscribe(userId: number): Observable<NotificationEvent> {
    return fromEvent<Notification>(
      this.eventEmitter,
      `notification.push:${userId}`,
    ).pipe(
      map((notification) => ({
        type: 'notification:new',
        notification: this.toPayload(notification),
      })),
    );
  }

  async listForUser(userId: number) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return notifications.map((notification) => this.toPayload(notification));
  }

  async getUnreadCount(userId: number) {
    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { unreadCount };
  }

  async markRead(userId: number, id: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return this.toPayload(updated);
  }

  async markAllRead(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { updated: result.count };
  }

  async delete(userId: number, id: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({ where: { id } });
    return { deleted: true };
  }

  async createNotification(
    userId: number,
    type: string,
    title: string,
    body?: string,
    referenceId?: string,
    referenceType?: string,
  ) {
    const created = await this.prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        body,
        referenceId,
        referenceType,
      },
    });

    this.eventEmitter.emit(`notification.push:${userId}`, created);
    this.eventEmitter.emit('notification.created', created);

    return created;
  }

  async sendReminder(event: CalendarEvent, userEmail: string) {
    try {
      await this.mailerService.sendMail({
        to: userEmail,
        subject: `Reminder: ${event.title} is coming up`,
        html: `
          <h2>Upcoming Event Reminder</h2>
          <p>Your event <strong>${event.title}</strong> starts at 
          <strong>${event.startTime.toLocaleTimeString()}</strong>.</p>
          ${event.description ? `<p>${event.description}</p>` : ''}
          <p>This is an automated reminder from AlzheiCare.</p>
        `,
      });
      this.logger.log(
        `Reminder sent to ${userEmail} for event: ${event.title}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send reminder to ${userEmail}:`, error);
      throw error;
    }
  }

  private toPayload(notification: Notification): NotificationPayload {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body ?? null,
      isRead: notification.isRead,
      referenceId: notification.referenceId,
      referenceType: notification.referenceType,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt ? notification.readAt.toISOString() : null,
    };
  }
}
