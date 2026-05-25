import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(private readonly eventEmitter: EventEmitter2) {
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
    let event: Stripe.Event;

    try {
      // 1. The Math: This function will automatically throw an error if the signature is fake.
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET as string,
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
        const session = event.data.object as Stripe.Checkout.Session;
        this.logger.log(
          `Payment successful for checkout session: ${session.id}`,
        );

        this.eventEmitter.emit('stripe.payment.success', session);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
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
}
