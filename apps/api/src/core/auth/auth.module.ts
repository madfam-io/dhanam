import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuditModule } from '@core/audit/audit.module';
import { LoggerModule } from '@core/logger/logger.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { RedisModule } from '@core/redis/redis.module';
import { EmailModule } from '@modules/email/email.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { TotpService } from './totp.service';
import { GuestAuthService } from './guest-auth.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '15m',
        issuer: 'dhanam-api',
        audience: 'dhanam-web',
      },
    }),
    PrismaModule,
    LoggerModule,
    RedisModule,
    AuditModule,
    forwardRef(() => EmailModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, TotpService, SessionService, GuestAuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService, TotpService, SessionService, GuestAuthService],
})
export class AuthModule {}
