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
import { LoginCredentialsDto } from '../DTOs/LoginCredentialsDto.js';
import { MailService } from '../../notifications/providers/mail.service.js';
import { UserRole } from '../Enums/User.enum.js';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(user: CreateUserDto) {
    if (!user.password) {
      throw new Error('Password is required.');
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
          role: user.Role || UserRole.Patient,
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

    await this.prisma.user.delete({ where: { id } });
  }
}
