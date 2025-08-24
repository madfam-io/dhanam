import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { TotpService } from './totp.service';
import { SessionService } from './session.service';
import { PrismaModule } from '@core/prisma/prisma.module';
import { LoggerModule } from '@core/logger/logger.module';
import { RedisModule } from '@core/redis/redis.module';
import { AuditModule } from '@core/audit/audit.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
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
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TotpService,
    SessionService,
    JwtStrategy,
    LocalStrategy,
  ],
  exports: [AuthService, TotpService, SessionService],
})
export class AuthModule {}