import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
import { RespondInvitationDto, RespondStatus } from './dto/respond-invitation.dto.js';
import * as crypto from 'crypto';

@Injectable()
export class InvitationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async sendInvitation(userId: number, dto: CreateInvitationDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    if (patient.doctorId) throw new ConflictException('Patient already has a doctor');

    const pending = await this.prisma.invitation.findFirst({
      where: { patientId: patient.id, status: 'PENDING' },
    });
    if (pending) throw new ConflictException('There is already a pending invitation');

    if (dto.doctorId) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { id: dto.doctorId },
        include: { user: true },
      });
      if (!doctor) throw new NotFoundException('Doctor not found');

      const invitation = await this.prisma.invitation.create({
  data: {
    patientId: patient.id, 
    doctorId: dto.doctorId,
    message: dto.message,
  },
});

try {
  await this.mailService.sendDoctorInvitationEmail(doctor.user, patient.user, invitation.id, dto.message);
} catch (err) {
  this.eventEmitter.emit('webhook.email.failed', { to: doctor.user.email, err });
}

      this.eventEmitter.emit('notification.invitation_received', { toUserId: doctor.userId, invitationId: invitation.id });
      return invitation;
    }

    if (dto.doctorEmail) {
      const token = crypto.randomBytes(32).toString('hex');
      const invitation = await this.prisma.invitation.create({
        data: {
          patientId: patient.id,
          doctorEmail: dto.doctorEmail,
          token,
          message: dto.message,
        },
      });

      try {
        await this.mailService.sendOnboardingInvitationEmail(dto.doctorEmail, patient.user, token, dto.message);
      } catch (err) {
        this.eventEmitter.emit('webhook.email.failed', { to: dto.doctorEmail, err });
      }

      return invitation;
    }

    throw new InternalServerErrorException('doctorId or doctorEmail must be provided');
  }

  async searchDoctors(query: string) {
    const doctors = await this.prisma.doctor.findMany({
      where: {
        OR: [
          { licenceNumber: { contains: query, mode: 'insensitive' } },
          { user: { firstName: { contains: query, mode: 'insensitive' } } },
          { user: { secondName: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: { user: true },
    });

    return doctors.map((d) => ({
      id: d.id,
      firstName: d.user.firstName,
      secondName: d.user.secondName,
      licenceNumber: d.licenceNumber,
      specialization: d.specialization,
    }));
  }

  async respondToInvitation(doctorId: number, invitationId: number, dto: RespondInvitationDto) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== 'PENDING') throw new ConflictException('Invitation is not pending');
    if (invitation.doctorId !== doctorId) throw new ForbiddenException('Not authorized to respond to this invitation');

    const updated = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: dto.status as any, respondedAt: new Date() },
    });

    if (dto.status === RespondStatus.ACCEPTED) {
      await this.prisma.patient.update({
        where: { id: invitation.patientId },
        data: { doctorId },
      });
      const conversation = await this.prisma.conversation.create({
        data: { patientId: invitation.patientId, doctorId },
      });

      try {
        await this.mailService.sendInvitationAcceptedEmail(invitation.patient.user, invitation.doctor?.user);
      } catch (err) {
        this.eventEmitter.emit('webhook.email.failed', { to: invitation.patient.user.email, err });
      }

      this.eventEmitter.emit('notification.invitation_accepted', { toUserId: invitation.patient.userId, conversationId: conversation.id });
    } else {
      try {
        await this.mailService.sendInvitationRejectedEmail(invitation.patient.user, invitation.doctor?.user);
      } catch (err) {
        this.eventEmitter.emit('webhook.email.failed', { to: invitation.patient.user.email, err });
      }
      this.eventEmitter.emit('notification.invitation_rejected', { toUserId: invitation.patient.userId, invitationId });
    }

    return updated;
  }

  async respondViaToken(token: string, userId: number, action: RespondStatus) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor profile not found');

    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { patient: { include: { user: true } } },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== 'PENDING') throw new ConflictException('Invitation is not pending');

    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { doctorId: doctor.id },
    });

    return this.respondToInvitation(doctor.id, invitation.id, { status: action } as RespondInvitationDto);
  }

  async respondViaTokenPublic(token: string, action: RespondStatus) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== 'PENDING') throw new ConflictException('Invitation is not pending');

    if (action === RespondStatus.REJECTED) {
      const updated = await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'REJECTED', respondedAt: new Date() },
      });

      try {
        await this.mailService.sendInvitationRejectedEmail(invitation.patient.user, invitation.doctor?.user);
      } catch (err) {
        this.eventEmitter.emit('webhook.email.failed', { to: invitation.patient.user.email, err });
      }

      this.eventEmitter.emit('notification.invitation_rejected', { toUserId: invitation.patient.userId, invitationId: invitation.id });
      return updated;
    }

    throw new ConflictException('Public accept is not supported. Please login to accept the invitation.');
  }

  async getMyInvitations(userId: number, role: string) {
    if (role === 'Patient') {
      const patient = await this.prisma.patient.findUnique({ where: { userId } });
      if (!patient) return [];
      return this.prisma.invitation.findMany({
        where: { patientId: patient.id },
        include: { doctor: { include: { user: true } } },
      });
    }

    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) return [];
    return this.prisma.invitation.findMany({
      where: { doctorId: doctor.id },
      include: { patient: { include: { user: true } } },
    });
  }
  async respondToInvitationByUserId(
  userId: number,
  invitationId: number,
  dto: RespondInvitationDto,
) {
  const doctor = await this.prisma.doctor.findUnique({
    where: { userId },
  });

  if (!doctor) {
    throw new NotFoundException('Doctor profile not found');
  }

  return this.respondToInvitation(
    doctor.id,
    invitationId,
    dto,
  );
}

}