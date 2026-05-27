import {
  Controller,
  Post,
  Headers,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service.js';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CurrentUser } from '../Decorators/currentUser.decorator.js';

@Controller()
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('webhooks/stripe')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    return this.stripeService.processWebhook(signature, rawBody);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stripe/create-checkout-session')
  async createSession(
    @CurrentUser() user: { sub?: number; id?: number; email?: string },
  ) {
    const userId = user?.id ?? user?.sub;
    if (!userId) {
      throw new BadRequestException('Authenticated user id is missing');
    }

    let userEmail = user?.email;
    if (!userEmail) {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!dbUser?.email) {
        throw new BadRequestException('User email not found');
      }
      userEmail = dbUser.email;
    }

    return this.stripeService.createCheckoutSession(userId, userEmail);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stripe/portal')
  async createPortal(@CurrentUser() user: { sub?: number; id?: number }) {
    const userId = user?.id ?? user?.sub;
    if (!userId) {
      throw new BadRequestException('Authenticated user id is missing');
    }

    // Changed 'user' to 'dbUser' here
    const dbUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!dbUser?.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer found for this user');
    }

    return this.stripeService.createPortalSession(dbUser.stripeCustomerId);
  }
}
