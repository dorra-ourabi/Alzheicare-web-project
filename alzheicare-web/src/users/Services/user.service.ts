import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../DTOs/createUserDto.js';
import { CreatePatientDto } from '../DTOs/createPatientDto.js';
import { CreateDoctorDto } from '../DTOs/createDoctorDto.js';
import { UpdateUserLocationDto } from '../DTOs/updateUserLocationDto.js';
import { MailService } from '../../mail/mail.service.js';
import { UserRole } from '../../../generated/prisma/client.js';
import { OnEvent } from '@nestjs/event-emitter';
import { RedisService } from '../../auth/Services/redis.service.js';

type CheckoutSession = any;

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
  ) {}

  async findAll() {
    return this.prisma.user.findMany({ where: { deletedAt: null } });
  }

  async findDoctors() {
    const doctors = await this.prisma.doctor.findMany({
      include: {
        user: true,
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    });

    return doctors.map((doctor) => ({
      id: doctor.id,
      userId: doctor.userId,
      firstName: doctor.user.firstName,
      secondName: doctor.user.secondName,
      username: doctor.user.username,
      email: doctor.user.email,
      specialization: doctor.specialization,
      licenceNumber: doctor.licenceNumber,
      isOnline: false,
    }));
  }

  async findMe(userId: number) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        doctor: {
          include: {
            user: true,
            patients: {
              include: { user: true },
            },
            conversations: {
              include: {
                doctor: { include: { user: true } },
                patient: { include: { user: true } },
                messages: {
                  orderBy: { sentAt: 'asc' },
                },
              },
            },
          },
        },
        patient: {
          include: {
            user: true,
            doctor: {
              include: {
                user: true,
              },
            },
            conversations: {
              include: {
                doctor: { include: { user: true } },
                patient: { include: { user: true } },
                messages: {
                  orderBy: { sentAt: 'asc' },
                },
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  async create(user: CreateUserDto) {
    const created = await this.createBaseUser(
      user,
      user.role || UserRole.Patient,
    );
    return {
      email: created.email,
      username: created.username,
      firstName: created.firstName,
    };
  }

  async createPatient(user: CreatePatientDto) {
    const created = await this.createBaseUser(user, UserRole.Patient);

    await this.prisma.patient.create({
      data: {
        userId: created.id,
        phoneNumber: user.phoneNumber,
      },
    });

    return created;
  }

  async createDoctor(user: CreateDoctorDto) {
    const created = await this.createBaseUser(user, UserRole.Doctor);

    await this.prisma.doctor.create({
      data: {
        userId: created.id,
        licenceNumber: user.licenceNumber,
        specialization: user.specialization,
      },
    });

    return created;
  }

  private async createBaseUser(user: CreateUserDto, role: UserRole) {
    if (!user.password) {
      throw new Error('Password is required!');
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    const emailVerificationToken = randomBytes(32).toString('hex');
    const emailVerificationExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );
    try {
      const newUser = await this.prisma.user.create({
        data: {
          username: user.username,
          firstName: user.firstName,
          secondName: user.secondName,
          email: user.email,
          password: hashedPassword,
          role,
          emailVerificationToken,
          emailVerificationExpiresAt,
          isEmailVerified: false,
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          secondName: true,
          role: true,
        },
      });

      // Send verification email
      try {
        await this.mailService.sendVerificationEmail(
          {
            email: user.email,
            firstName: user.firstName,
          },
          emailVerificationToken,
        );
      } catch (err) {
        // log and continue
        console.error('Failed to send verification email', err);
      }

      // Ensure doctor/patient profile exists
      if (role === UserRole.Doctor) {
        await this.prisma.doctor.upsert({
          where: { userId: newUser.id },
          update: {},
          create: {
            userId: newUser.id,
            licenceNumber: (user as any).licenceNumber,
          },
        });
      } else {
        await this.prisma.patient.upsert({
          where: { userId: newUser.id },
          update: {},
          create: { userId: newUser.id },
        });
      }

      return newUser;
    } catch (e) {
      console.error('Error creating user:', e);
      throw new ConflictException(
        'Email already exists or username already exists',
      );
    }
  }

  async update(id: number, user: Partial<CreateUserDto>) {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`User with id ${id} not found.`);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...user,
        updatedAt: new Date(),
      },
    });
  }

  async updateMyLocation(userId: number, data: UpdateUserLocationDto) {
    const currentUser = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });

    if (!currentUser) {
      throw new NotFoundException(`User with id ${userId} not found.`);
    }

    if (data.address !== undefined) {
      await this.prisma.patient.update({
        where: { userId },
        data: {
          address: data.address?.trim() || null,
        },
      });
    }

    if (data.currentPosition) {
      const timestamp = new Date().toISOString();
      const key = `users:${userId}:current-location:${timestamp}`;
      try {
        await this.redisService.set(
          key,
          JSON.stringify({
            ...data.currentPosition,
            savedAt: timestamp,
          }),
        );
      } catch (error) {
        console.error('Failed to persist current location snapshot', error);
      }
    }

    return this.findMe(userId);
  }

  async remove(id: number) {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`User with id ${id} not found.`);
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  @OnEvent('stripe.payment.success')
  async handleSubscriptionActivated(session: CheckoutSession) {
    console.log(
      `[Event Listener] Intercepted stripe.payment.success for session: ${session.id}`,
    );

    const userId = session.metadata?.userId
      ? parseInt(session.metadata.userId, 10)
      : null;
    const stripeCustomerId = session.customer as string;

    if (!userId) {
      console.error(
        `[Event Error] No userId found in Stripe session metadata.`,
      );
      return;
    }

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          stripeCustomerId: stripeCustomerId,
          isPremium: true,
        },
      });

      console.log(
        `[Database Sync] Successfully upgraded User #${userId} to Premium!`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `[Database Error] Failed to update premium status for User #${userId}:`,
        errorMessage,
      );
    }
  }
}
