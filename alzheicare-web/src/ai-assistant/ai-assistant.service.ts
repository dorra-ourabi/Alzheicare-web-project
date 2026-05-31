import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserRole } from '../../generated/prisma/client.js';

type AiRole = 'caregiver' | 'doctor' | 'admin';

interface UploadedAudioFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

interface AiPatientContext {
  sub: string;
  role: AiRole;
  patient_id: string;
  patient_name: string;
  patient_age: number;
  patient_stage: number;
}

@Injectable()
export class AiAssistantService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  getHealth() {
    return this.requestPublic('GET', '/health');
  }

  async chat(
    userId: number,
    userRole: UserRole | undefined,
    message: string,
    language?: string,
    patientId?: number,
  ) {
    const token = await this.buildAiToken(userId, userRole, patientId);
    return this.request('POST', '/chat', {
      token,
      body: { message, language: language ?? null },
    });
  }

  async chatStream(
    userId: number,
    userRole: UserRole | undefined,
    message: string,
    language?: string,
    patientId?: number,
  ): Promise<Response> {
    const token = await this.buildAiToken(userId, userRole, patientId);
    return this.rawRequest('POST', '/chat/stream', {
      token,
      body: { message, language: language ?? null },
      accept: 'text/event-stream',
    });
  }

  async clearHistory(
    userId: number,
    userRole: UserRole | undefined,
    patientId?: number,
  ) {
    const token = await this.buildAiToken(userId, userRole, patientId);
    return this.request('DELETE', '/chat/history', { token });
  }

  async transcribe(
    userId: number,
    userRole: UserRole | undefined,
    file: UploadedAudioFile,
    language?: string,
    patientId?: number,
  ) {
    const token = await this.buildAiToken(userId, userRole, patientId);
    const formData = new FormData();
    formData.append(
      'audio',
      new Blob([new Uint8Array(file.buffer)], {
        type: file.mimetype || 'application/octet-stream',
      }),
      file.originalname || 'audio.webm',
    );
    if (language) {
      formData.append('language', language);
    }

    return this.request('POST', '/transcribe', { token, formData });
  }

  async speak(
    userId: number,
    userRole: UserRole | undefined,
    text: string,
    patientId?: number,
  ): Promise<ArrayBuffer> {
    const token = await this.buildAiToken(userId, userRole, patientId);
    const response = await this.rawRequest('POST', '/speak', {
      token,
      body: { text },
      accept: 'audio/mpeg',
    });
    return response.arrayBuffer();
  }

  async ragStatus(userId: number, userRole: UserRole | undefined, patientId?: number) {
    const token = await this.buildAiToken(userId, userRole, patientId);
    return this.request('GET', '/rag/status', { token });
  }

  async ragDebugRetrieve(
    userId: number,
    userRole: UserRole | undefined,
    query: string,
    topK?: number,
    patientId?: number,
  ) {
    const token = await this.buildAiToken(userId, userRole, patientId);
    return this.request('POST', '/rag/debug-retrieve', {
      token,
      body: { query, top_k: topK ?? null },
    });
  }

  async ragReload(userId: number, userRole: UserRole | undefined, patientId?: number) {
    const token = await this.buildAiToken(userId, userRole, patientId);
    return this.request('POST', '/rag/reload', { token });
  }

  private async buildAiToken(
    userId: number,
    userRole: UserRole | undefined,
    patientId?: number,
  ): Promise<string> {
    const context = await this.resolvePatientContext(userId, userRole, patientId);
    const secret =
      this.configService.get<string>('AI_JWT_SECRET') || 'dev_secret';

    return this.jwtService.signAsync(context, {
      secret,
      expiresIn: '15m',
    });
  }

  private async resolveUserRole(
    userId: number,
    userRole?: UserRole,
  ): Promise<UserRole> {
    if (userRole) {
      return userRole;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.role;
  }

  private async resolvePatientContext(
    userId: number,
    userRole: UserRole | undefined,
    patientId?: number,
  ): Promise<AiPatientContext> {
    const resolvedRole = await this.resolveUserRole(userId, userRole);
    const patient = await this.loadPatient(userId, resolvedRole, patientId);
  
    const sessionKey = patientId
      ? `${userId}_p${patientId}`
      : String(userId);
  
    return {
      sub: sessionKey,           
      role: this.mapRole(resolvedRole),
      patient_id: String(patient.id),
      patient_name: `${patient.user.firstName} ${patient.user.secondName}`.trim(),
      patient_age: this.calculateAge(patient.dateOfBirth),
      patient_stage: this.derivePatientStage(patient.dateOfDiagnosis),
    };
  }

  private async loadPatient(
    userId: number,
    userRole: UserRole,
    patientId?: number,
  ) {
    if (userRole === UserRole.Patient) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId },
        include: { user: true },
      });
      if (!patient) {
        throw new NotFoundException('Patient profile not found');
      }
      return patient;
    }

    if (!patientId) {
      throw new BadRequestException(
        'patientId is required for doctor and admin users',
      );
    }

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true, doctor: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (userRole === UserRole.Doctor) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId },
      });
      if (!doctor || patient.doctorId !== doctor.id) {
        throw new ForbiddenException(
          'You do not have access to this patient',
        );
      }
    }

    return patient;
  }

  private mapRole(role: UserRole): AiRole {
    switch (role) {
      case UserRole.Doctor:
        return 'doctor';
      case UserRole.Admin:
        return 'admin';
      default:
        return 'caregiver';
    }
  }

  private calculateAge(dateOfBirth: Date | null): number {
    if (!dateOfBirth) {
      return 75;
    }

    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      age -= 1;
    }
    return age;
  }

  private derivePatientStage(dateOfDiagnosis: Date | null): number {
    if (!dateOfDiagnosis) {
      return 1;
    }

    const yearsSinceDiagnosis =
      (Date.now() - dateOfDiagnosis.getTime()) /
      (365.25 * 24 * 60 * 60 * 1000);

    if (yearsSinceDiagnosis < 3) {
      return 0;
    }
    if (yearsSinceDiagnosis <= 7) {
      return 1;
    }
    return 2;
  }

  private baseUrl(): string {
    return (
      this.configService.get<string>('AI_SERVICE_URL') ||
      'http://localhost:8000'
    );
  }

  private internalKey(): string | undefined {
    return this.configService.get<string>('AI_SERVICE_INTERNAL_KEY');
  }

  private buildHeaders(
    token: string,
    accept?: string,
    contentType?: string,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    if (accept) {
      headers.Accept = accept;
    }
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    const internalKey = this.internalKey();
    if (internalKey) {
      headers['X-Internal-Key'] = internalKey;
    }

    return headers;
  }

  private async requestPublic(method: string, path: string) {
    const url = `${this.baseUrl()}${path}`;

    let response: Response;
    try {
      response = await fetch(url, { method });
    } catch {
      throw new ServiceUnavailableException(
        'AI assistant service is unavailable',
      );
    }

    if (!response.ok) {
      await this.throwUpstreamError(response);
    }

    return response.json();
  }

  private async request(
    method: string,
    path: string,
    options: {
      token: string;
      body?: unknown;
      formData?: FormData;
      accept?: string;
    },
  ) {
    const response = await this.rawRequest(method, path, options);

    if (!response.ok) {
      await this.throwUpstreamError(response);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  private async rawRequest(
    method: string,
    path: string,
    options: {
      token: string;
      body?: unknown;
      formData?: FormData;
      accept?: string;
    },
  ): Promise<Response> {
    const url = `${this.baseUrl()}${path}`;
    const headers = this.buildHeaders(
      options.token,
      options.accept,
      options.formData ? undefined : 'application/json',
    );

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: options.formData
          ? options.formData
          : options.body
            ? JSON.stringify(options.body)
            : undefined,
      });
    } catch {
      throw new ServiceUnavailableException(
        'AI assistant service is unavailable',
      );
    }

    return response;
  }

  private async throwUpstreamError(response: Response): Promise<never> {
    const contentType = response.headers.get('content-type') || '';
    let detail: unknown = `AI service returned ${response.status}`;

    if (contentType.includes('application/json')) {
      try {
        detail = await response.json();
      } catch {
        detail = await response.text();
      }
    } else {
      detail = await response.text();
    }

    if (response.status === 503) {
      throw new ServiceUnavailableException(detail);
    }

    if (response.status >= 500) {
      throw new BadGatewayException(detail);
    }

    throw new BadGatewayException(detail);
  }
}
