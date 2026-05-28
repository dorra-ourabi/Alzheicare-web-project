import { Test, TestingModule } from '@nestjs/testing';
import { InvitationService } from './invitation.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
import {
  RespondInvitationDto,
  RespondStatus,
} from './dto/respond-invitation.dto.js';

describe('InvitationService', () => {
  let service: InvitationService;
  const mockPrisma: any = {
    patient: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    invitation: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    doctor: { findUnique: jest.fn() },
    conversation: { create: jest.fn() },
  };

  const mockMail: any = {
    sendDoctorInvitationEmail: jest.fn(),
    sendOnboardingInvitationEmail: jest.fn(),
    sendInvitationAcceptedEmail: jest.fn(),
    sendInvitationRejectedEmail: jest.fn(),
  };

  const mockEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMail },
        { provide: EventEmitter2, useValue: mockEmitter },
      ],
    }).compile();

    service = module.get<InvitationService>(InvitationService);
    jest.clearAllMocks();
  });

  it('should send invitation to doctor on platform', async () => {
    mockPrisma.patient.findUnique.mockResolvedValue({
      id: 1,
      user: { firstName: 'P', secondName: 'A' },
      doctorId: null,
    });
    mockPrisma.invitation.findFirst.mockResolvedValue(null);
    mockPrisma.doctor.findUnique.mockResolvedValue({
      id: 2,
      user: { email: 'doc@example.com' },
      userId: 10,
    });
    mockPrisma.invitation.create.mockResolvedValue({
      id: 5,
      patientId: 1,
      doctorId: 2,
      status: 'PENDING',
    });

    const dto: CreateInvitationDto = { doctorId: 2, message: 'Hi' };
    const res = await service.sendInvitation(1, dto);

    expect(mockPrisma.invitation.create).toHaveBeenCalled();
    expect(mockMail.sendDoctorInvitationEmail).toHaveBeenCalled();
    expect(mockEmitter.emit).toHaveBeenCalledWith(
      'notification.invitation_received',
      expect.any(Object),
    );
    expect(res).toHaveProperty('id', 5);
  });

  it('should send invitation to doctor not on platform (email + token)', async () => {
    mockPrisma.patient.findUnique.mockResolvedValue({
      id: 2,
      user: { firstName: 'X', secondName: 'Y' },
      doctorId: null,
    });
    mockPrisma.invitation.findFirst.mockResolvedValue(null);
    mockPrisma.invitation.create.mockResolvedValue({
      id: 6,
      patientId: 2,
      doctorEmail: 'newdoc@example.com',
      token: 'tok',
    });

    const dto: CreateInvitationDto = {
      doctorEmail: 'newdoc@example.com',
      message: 'Please join',
    };
    const res = await service.sendInvitation(2, dto);

    expect(mockPrisma.invitation.create).toHaveBeenCalled();
    expect(mockMail.sendOnboardingInvitationEmail).toHaveBeenCalled();
    expect(res).toHaveProperty('id', 6);
  });

  it('should accept invitation and create conversation', async () => {
    mockPrisma.invitation.findUnique.mockResolvedValue({
      id: 7,
      patientId: 3,
      doctorId: 4,
      status: 'PENDING',
      patient: { id: 3, user: { email: 'p@e.com' }, userId: 20 },
      doctor: { id: 4, user: { email: 'd@e.com' } },
    });
    mockPrisma.invitation.update.mockResolvedValue({
      id: 7,
      status: 'ACCEPTED',
    });
    mockPrisma.patient.update.mockResolvedValue({ id: 3, doctorId: 4 });
    mockPrisma.conversation.create.mockResolvedValue({
      id: 99,
      patientId: 3,
      doctorId: 4,
    });

    const dto: RespondInvitationDto = { status: RespondStatus.ACCEPTED };
    const res = await service.respondToInvitation(4, 7, dto);

    expect(mockPrisma.invitation.update).toHaveBeenCalled();
    expect(mockPrisma.patient.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { doctorId: 4 },
    });
    expect(mockPrisma.conversation.create).toHaveBeenCalled();
    expect(mockMail.sendInvitationAcceptedEmail).toHaveBeenCalled();
  });

  it('should reject invitation and notify patient', async () => {
    mockPrisma.invitation.findUnique.mockResolvedValue({
      id: 8,
      patientId: 5,
      doctorId: 6,
      status: 'PENDING',
      patient: { id: 5, user: { email: 'p2@e.com' }, userId: 30 },
      doctor: { id: 6, user: { email: 'd2@e.com' } },
    });
    mockPrisma.invitation.update.mockResolvedValue({
      id: 8,
      status: 'REJECTED',
    });

    const dto: RespondInvitationDto = { status: RespondStatus.REJECTED };
    const res = await service.respondToInvitation(6, 8, dto);

    expect(mockPrisma.invitation.update).toHaveBeenCalled();
    expect(mockMail.sendInvitationRejectedEmail).toHaveBeenCalled();
  });

  it('should block duplicate pending invitation', async () => {
    mockPrisma.patient.findUnique.mockResolvedValue({
      id: 9,
      user: { firstName: 'A' },
      doctorId: null,
    });
    mockPrisma.invitation.findFirst.mockResolvedValue({
      id: 10,
      status: 'PENDING',
    });

    await expect(
      service.sendInvitation(9, { doctorEmail: 'a@b.com' } as any),
    ).rejects.toThrow();
  });

  it('should block if patient already has a doctor', async () => {
    mockPrisma.patient.findUnique.mockResolvedValue({
      id: 11,
      user: { firstName: 'B' },
      doctorId: 2,
    });
    await expect(
      service.sendInvitation(11, { doctorEmail: 'x@y.com' } as any),
    ).rejects.toThrow();
  });
});
