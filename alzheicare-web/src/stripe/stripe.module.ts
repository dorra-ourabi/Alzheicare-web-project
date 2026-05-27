import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service.js';
import { StripeController } from './stripe.controller.js';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [StripeService, JwtAuthGuard],
  controllers: [StripeController],
})
export class StripeModule {}
