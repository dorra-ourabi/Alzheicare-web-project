import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name);
  private listeners: Array<() => void> = [];

  constructor(private readonly prisma: PrismaService, private readonly eventEmitter: EventEmitter2) {}

  onModuleInit() {
    // Listen to events emitted elsewhere and create notifications
    this.eventEmitter.on('notification.invitation_received', (payload) => this.handleInvitationReceived(payload));
    this.eventEmitter.on('notification.invitation_accepted', (payload) => this.handleInvitationAccepted(payload));
    this.eventEmitter.on('notification.invitation_rejected', (payload) => this.handleInvitationRejected(payload));
    this.eventEmitter.on('notification.new_message', (payload) => this.handleNewMessage(payload));
  }

  onModuleDestroy() {
    this.listeners.forEach((l) => l());
  }

  private async handleInvitationReceived(payload: any) {
    const { toUserId, invitationId } = payload;
    const title = 'New invitation received';
    const body = 'A patient sent you an invitation to connect.';
    const notification = await this.createNotification(toUserId, 'INVITATION_RECEIVED', title, body, invitationId, 'Invitation');
    // create webhook event (email)
    await this.createWebhookEvents(notification, 'INVITATION_SENT');
  }

  private async handleInvitationAccepted(payload: any) {
    const { toUserId, conversationId } = payload;
    const title = 'Invitation accepted';
    const body = 'Your invitation was accepted by the doctor.';
    const notification = await this.createNotification(toUserId, 'INVITATION_ACCEPTED', title, body, conversationId, 'Conversation');
    await this.createWebhookEvents(notification, 'INVITATION_ACCEPTED');
  }

  private async handleInvitationRejected(payload: any) {
    const { toUserId, invitationId } = payload;
    const title = 'Invitation declined';
    const body = 'Your invitation was declined by the doctor.';
    const notification = await this.createNotification(toUserId, 'INVITATION_REJECTED', title, body, invitationId, 'Invitation');
    await this.createWebhookEvents(notification, 'INVITATION_REJECTED');
  }

  private async handleNewMessage(payload: any) {
    const { toUserId, messageId } = payload;
    const title = 'New message';
    const body = 'You have received a new message.';
    const notification = await this.createNotification(toUserId, 'NEW_MESSAGE', title, body, messageId, 'Message');
    await this.createWebhookEvents(notification, 'NEW_MESSAGE');
  }

  async createNotification(userId: number, type: string, title: string, body?: string, referenceId?: number, referenceType?: string) {
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

    // emit SSE push
    this.eventEmitter.emit(`notification.push:${userId}`, created);
    this.eventEmitter.emit('notification.created', created);

    return created;
  }

  async createWebhookEvents(notification: any, trigger: string) {
    // default: EMAIL channel
    const user = await this.prisma.user.findUnique({ where: { id: notification.userId } });
    if (!user) return;

    const payload = { notificationId: notification.id, title: notification.title, body: notification.body };

    await this.prisma.webhookEvent.create({
      data: {
        userId: notification.userId,
        channel: 'EMAIL',
        triggerType: trigger as any,
        recipient: user.email,
        subject: notification.title,
        payload,
      },
    });
  }
}
