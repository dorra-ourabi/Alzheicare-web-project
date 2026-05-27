import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('notification.invitation_received')
  async handleInvitationReceived(payload: any) {
    const { toUserId, invitationId } = payload;
    const notification = await this.createNotification(
      toUserId,
      'INVITATION_RECEIVED',
      'New invitation received',
      'A patient sent you an invitation to connect.',
      invitationId,
      'Invitation',
    );
    await this.createWebhookEvents(notification, 'INVITATION_SENT');
  }

  @OnEvent('notification.invitation_accepted')
  async handleInvitationAccepted(payload: any) {
    const { toUserId, conversationId } = payload;
    const notification = await this.createNotification(
      toUserId,
      'INVITATION_ACCEPTED',
      'Invitation accepted',
      'Your invitation was accepted by the doctor.',
      conversationId,
      'Conversation',
    );
    await this.createWebhookEvents(notification, 'INVITATION_ACCEPTED');
  }

  @OnEvent('notification.invitation_rejected')
  async handleInvitationRejected(payload: any) {
    const { toUserId, invitationId } = payload;
    const notification = await this.createNotification(
      toUserId,
      'INVITATION_REJECTED',
      'Invitation declined',
      'Your invitation was declined by the doctor.',
      invitationId,
      'Invitation',
    );
    await this.createWebhookEvents(notification, 'INVITATION_REJECTED');
  }

  @OnEvent('notification.new_message')
  async handleNewMessage(payload: any) {
    const { toUserId, messageId } = payload;
    const notification = await this.createNotification(
      toUserId,
      'NEW_MESSAGE',
      'New message',
      'You have received a new message.',
      messageId,
      'Message',
    );
    await this.createWebhookEvents(notification, 'NEW_MESSAGE');
  }

  async createNotification(
    userId: number,
    type: string,
    title: string,
    body?: string,
    referenceId?: number,
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

  async createWebhookEvents(notification: any, trigger: string) {
    const user = await this.prisma.user.findUnique({ where: { id: notification.userId } });
    if (!user) return;

    const payload = {
      notificationId: notification.id,
      title: notification.title,
      body: notification.body,
    };

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