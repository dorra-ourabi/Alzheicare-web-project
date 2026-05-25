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
import { MailService } from '../../notifications/providers/mail.service.js';
import { UserRole } from '../../../generated/prisma/client.js';
import { OnEvent } from '@nestjs/event-emitter';
import Stripe from 'stripe';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async findAll() {
    return this.prisma.user.findMany({ where: { deletedAt: null } });
  }

  async findOne(id: number) {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  async create(user: CreateUserDto) {
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
          username: user.username!,
          firstName: user.firstName!,
          secondName: user.secondName!,
          email: user.email!,
          password: hashedPassword,
          role: user.role || UserRole.Patient,
          emailVerificationToken,
          emailVerificationExpiresAt,
          isEmailVerified: false,
        },
        select: {
          email: true,
          username: true,
        },
      });

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
  async handleSubscriptionActivated(session: Stripe.Checkout.Session) {
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
