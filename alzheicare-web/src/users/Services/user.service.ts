import {
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
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
import { NotificationService } from '../../notifications/notification.service.js';

type CheckoutSession = any;

@Injectable()
export class UserService {
  private readonly logger = new Logger('UserService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
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

      // Trigger geofence check
      this.checkGeofence(userId, data.currentPosition, data.address).catch((err) => {
        this.logger.error('Geofence check failed', err);
      });
    }

    return this.findMe(userId);
  }

  private async checkGeofence(
    userId: number,
    currentPosition: { lat: number; lng: number },
    address?: string | null,
  ) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      select: { address: true },
    });

    if (!patient) {
      return; // Not a patient
    }

    const homeAddress = patient.address;
    if (!homeAddress) {
      return; // No home address set
    }

    // Check suppression state
    const suppressKey = `users:${userId}:geofence:suppressed`;
    const isSuppressed = await this.redisService.get(suppressKey);
    if (isSuppressed) {
      this.logger.log(`Geofence alert suppressed for user ${userId}`);
      return;
    }

    // Check cooldown to prevent spam
    const cooldownKey = `users:${userId}:geofence:cooldown`;
    const inCooldown = await this.redisService.get(cooldownKey);
    if (inCooldown) {
      return;
    }

    // Geocode home address
    const homeCoords = await this.resolveHomeCoordinates(homeAddress);
    if (!homeCoords) {
      return;
    }

    // Calculate distance
    const distanceMeters = this.calculateDistanceMeters(
      currentPosition.lat,
      currentPosition.lng,
      homeCoords.lat,
      homeCoords.lng,
    );

    const safeRadius = Number(process.env.SAFE_RADIUS_METERS) || 300;
    if (distanceMeters > safeRadius) {
      // Outside safe zone - send alert to caregivers
      try {
        await this.notificationService.sendGeofenceAlert(userId, {
          lat: currentPosition.lat,
          lng: currentPosition.lng,
          address,
          homeAddress,
          updatedAt: new Date().toISOString(),
        });

        // Set cooldown
        const cooldownSeconds = Number(process.env.GEOFENCE_ALERT_COOLDOWN_SECONDS) || 300;
        await this.redisService.set(cooldownKey, '1', cooldownSeconds);
      } catch (error) {
        this.logger.error('Failed to send geofence alert', error);
      }
    }
  }

  private async resolveHomeCoordinates(address: string): Promise<{ lat: number; lng: number } | null> {
    const cacheKey = `geofence:coords:${address}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Malformed cache, continue
      }
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'AlzheiCare/1.0' } },
      );

      const results = await response.json();
      if (results.length === 0) {
        this.logger.warn(`No geocoding results for address: ${address}`);
        return null;
      }

      const coords = {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
      };

      // Cache for 7 days
      await this.redisService.set(cacheKey, JSON.stringify(coords), 604800);
      return coords;
    } catch (error) {
      this.logger.error(`Geocoding failed for address: ${address}`, error);
      return null;
    }
  }

  private calculateDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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
