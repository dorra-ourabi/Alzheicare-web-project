import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './Services/redis.service.js';
import { AuthGoogleService } from './Services/googleAuthservice.js';
import { AuthController } from './controllers/auth.controller.js';
import { AuthService } from './Services/auth.service.js';
import { JwtAuthGuard } from './Guards/jwt.guard.js'; 

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: '15m' },

    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RedisService, AuthGoogleService, JwtAuthGuard], 
  exports: [AuthService, AuthGoogleService, RedisService, JwtModule],
})
export class AuthModule {}
