import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AiAssistantService } from './ai-assistant.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserRole } from '../../generated/prisma/client.js';

describe('AiAssistantService', () => {
  let service: AiAssistantService;

  const mockPrisma = {
    patient: {
      findUnique: jest.fn(),
    },
    doctor: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('ai-token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        AI_JWT_SECRET: 'dev_secret',
        AI_SERVICE_URL: 'http://localhost:8000',
      };
      return values[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAssistantService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(AiAssistantService);
  });

  it('requires patientId for doctor users', async () => {
    await expect(
      service.chat(2, UserRole.Doctor, 'Hello'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks doctor access to unassigned patients', async () => {
    mockPrisma.patient.findUnique.mockResolvedValue({
      id: 10,
      doctorId: 99,
      dateOfBirth: new Date('1950-01-01'),
      dateOfDiagnosis: new Date('2020-01-01'),
      user: { firstName: 'Maya', secondName: 'Lee' },
      doctor: { id: 99 },
    });
    mockPrisma.doctor.findUnique.mockResolvedValue({
      id: 1,
      userId: 2,
    });

    await expect(
      service.chat(2, UserRole.Doctor, 'Hello', undefined, 10),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('builds AI token for patient users', async () => {
    mockPrisma.patient.findUnique.mockResolvedValue({
      id: 5,
      dateOfBirth: new Date('1950-06-15'),
      dateOfDiagnosis: new Date('2021-01-01'),
      user: { firstName: 'Maya', secondName: 'Lee' },
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ reply: 'Bonjour', used_search: false }),
    }) as unknown as typeof fetch;

    const result = await service.chat(1, UserRole.Patient, 'Bonjour');

    expect(mockJwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: '1',
        role: 'caregiver',
        patient_id: '5',
        patient_name: 'Maya Lee',
        patient_stage: 1,
      }),
      expect.objectContaining({ secret: 'dev_secret' }),
    );
    expect(result).toEqual({ reply: 'Bonjour', used_search: false });
  });

  it('proxies health check without auth token', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'healthy' }),
    }) as unknown as typeof fetch;

    const result = await service.getHealth();

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/health',
      { method: 'GET' },
    );
    expect(result).toEqual({ status: 'healthy' });
  });
});
