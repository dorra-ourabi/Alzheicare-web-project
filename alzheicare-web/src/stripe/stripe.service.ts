import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: any;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      throw new Error('Missing STRIPE_SECRET_KEY');
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET');
    }

    this.stripe = new Stripe(stripeSecret, {
      apiVersion: '2026-04-22.dahlia',
    });
  }

  async processWebhook(signature: string, rawBody: Buffer) {
    let event: any;

    try {
      // 1. The Math: This function will automatically throw an error if the signature is fake.
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Webhook signature verification failed: ${message}`);
      // Throwing a 400 error instantly rejects the request and sends it back to the attacker.
      throw new BadRequestException('Invalid signature');
    }

    // 2. Handle the event!
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as { id: string };
        this.logger.log(
          `Payment successful for checkout session: ${session.id}`,
        );

        this.eventEmitter.emit('stripe.payment.success', session);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as { customer: string };
        this.logger.log(
          `Subscription canceled for customer: ${subscription.customer}`,
        );

        this.eventEmitter.emit('stripe.subscription.canceled', subscription);
        break;
      }

      default:
        // We don't care about the other 100+ event types Stripe sends.
        this.logger.debug(`Ignored unhandled Stripe event type: ${event.type}`);
    }

    // 3. Always return a 200 OK so Stripe knows you received it and doesn't retry.
    return { received: true };
  }

  async createCheckoutSession(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) {
      throw new BadRequestException('User email not found');
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      throw new BadRequestException('Missing STRIPE_PRICE_ID');
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        metadata: {
          userId: userId.toString(),
        },
        customer_email: user.email,
        // Where to send the user after they finish paying or cancel
        success_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      });

      return { url: session.url }; // Return the secure link to the frontend
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create checkout session: ${message}`);
      throw new Error('Could not initiate payment session');
    }
  }
}
