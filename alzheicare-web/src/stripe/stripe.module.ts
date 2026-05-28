import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';
import { StripeService } from './stripe.service.js';
import { StripeController } from './stripe.controller.js';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [StripeService, JwtAuthGuard],
  controllers: [StripeController],
})
export class StripeModule {}
