import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { AuthController, GoogleAuthController } from './controllers/auth.controller.js';
import { AuthService } from './Services/auth.service.js';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController, GoogleAuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
