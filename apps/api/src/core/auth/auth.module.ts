import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuditModule } from '@core/audit/audit.module';
import { CryptoModule } from '@core/crypto/crypto.module';
import { LoggerModule } from '@core/logger/logger.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { RedisModule } from '@core/redis/redis.module';
import { EmailModule } from '@modules/email/email.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DemoAuthService } from './demo-auth.service';
import { GuestAuthService } from './guest-auth.service';
import { SessionService } from './session.service';
import { JanuaStrategy } from './strategies/janua.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { TotpService } from './totp.service';

/**
 * =============================================================================
 * Authentication Module (Galaxy Ecosystem Integration)
 * =============================================================================
 * Supports two authentication modes:
 *
 * 1. JANUA MODE (Production - Recommended)
 *    - Uses Janua OIDC for authentication (auth.madfam.io)
 *    - RS256 JWT validation via JWKS endpoint
 *    - Enables "One Membership, All Services" across Galaxy ecosystem
 *    - Set JANUA_ENABLED=true in environment
 *
 * 2. LEGACY MODE (Development/Standalone)
 *    - Uses local JWT with symmetric key (JWT_SECRET)
 *    - Local user registration and login
 *    - Set JANUA_ENABLED=false in environment
 * =============================================================================
 */
@Module({
  imports: [
    // Default strategy is 'janua' when JANUA_ENABLED=true, else 'jwt'
    PassportModule.register({
      defaultStrategy: process.env.JANUA_ENABLED === 'true' ? 'janua' : 'jwt',
    }),
    // JwtModule still needed for legacy mode and internal token operations
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: '15m',
          issuer: 'dhanam-api',
          audience: 'dhanam-web',
        },
      }),
    }),
    PrismaModule,
    LoggerModule,
    RedisModule,
    AuditModule,
    CryptoModule,
    forwardRef(() => EmailModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TotpService,
    SessionService,
    GuestAuthService,
    DemoAuthService,
    // Register both strategies - guard will select based on config
    JanuaStrategy,
    JwtStrategy,
    LocalStrategy,
  ],
  exports: [AuthService, TotpService, SessionService, GuestAuthService, DemoAuthService],
})
export class AuthModule { }
