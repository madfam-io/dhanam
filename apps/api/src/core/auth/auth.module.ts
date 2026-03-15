import { AUTH_DEFAULTS } from '@dhanam/shared';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuditModule } from '@core/audit/audit.module';
import { SecurityConfigService } from '@core/config/security.config';
import { CryptoModule } from '@core/crypto/crypto.module';
import { LoggerModule } from '@core/logger/logger.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { RedisModule } from '@core/redis/redis.module';
import { EmailModule } from '@modules/email/email.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DemoAuthService } from './demo-auth.service';
import { GuestAuthService } from './guest-auth.service';
import {
  AUTH_PROVIDER,
  AuthMode,
  JanuaAuthProvider,
  JanuaMfaProvider,
  LocalAuthProvider,
  LocalMfaProvider,
  MFA_PROVIDER,
} from './providers';
import { SessionService } from './session.service';
import { JanuaStrategy } from './strategies/janua.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { TotpService } from './totp.service';

/**
 * =============================================================================
 * Authentication Module (Galaxy Ecosystem Integration)
 * =============================================================================
 * Supports two authentication modes controlled by AUTH_MODE env var:
 *
 * 1. JANUA MODE (AUTH_MODE=janua — Production)
 *    - Uses Janua OIDC for authentication (auth.madfam.io)
 *    - RS256 JWT validation via JWKS endpoint
 *    - Enables "One Membership, All Services" across Galaxy ecosystem
 *
 * 2. LOCAL MODE (AUTH_MODE=local — Self-hosted / Development)
 *    - Uses local JWT with symmetric key (JWT_SECRET)
 *    - Local user registration and login
 *
 * Both modes implement AuthProvider and MfaProvider interfaces.
 * Controllers inject AUTH_PROVIDER / MFA_PROVIDER tokens and delegate
 * without knowing which mode is active.
 *
 * JANUA_ENABLED is deprecated — use AUTH_MODE instead.
 * =============================================================================
 */

function resolveAuthMode(): AuthMode {
  if (process.env.AUTH_MODE === 'janua' || process.env.AUTH_MODE === 'local') {
    return process.env.AUTH_MODE;
  }
  // Backwards compat: fall back to JANUA_ENABLED
  return process.env.JANUA_ENABLED === 'true' ? 'janua' : 'local';
}

@Module({
  imports: [
    // Default strategy is 'janua' when in janua mode, else 'jwt'
    PassportModule.register({
      defaultStrategy: resolveAuthMode() === 'janua' ? 'janua' : 'jwt',
    }),
    // JwtModule still needed for local mode and internal token operations
    // (demo/guest tokens are always local HS256 regardless of auth mode)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ??
            AUTH_DEFAULTS.JWT_EXPIRY) as typeof AUTH_DEFAULTS.JWT_EXPIRY,
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
    // Core services (always registered — used by local providers and internally)
    AuthService,
    TotpService,
    SessionService,
    GuestAuthService,
    DemoAuthService,
    SecurityConfigService,

    // Passport strategies — guard will select based on config
    JanuaStrategy,
    JwtStrategy,
    LocalStrategy,

    // Provider wrappers
    LocalAuthProvider,
    LocalMfaProvider,
    JanuaAuthProvider,
    JanuaMfaProvider,

    // AUTH_PROVIDER token — resolved based on AUTH_MODE
    {
      provide: AUTH_PROVIDER,
      useFactory: (local: LocalAuthProvider, janua: JanuaAuthProvider) =>
        resolveAuthMode() === 'janua' ? janua : local,
      inject: [LocalAuthProvider, JanuaAuthProvider],
    },

    // MFA_PROVIDER token — resolved based on AUTH_MODE
    {
      provide: MFA_PROVIDER,
      useFactory: (local: LocalMfaProvider, janua: JanuaMfaProvider) =>
        resolveAuthMode() === 'janua' ? janua : local,
      inject: [LocalMfaProvider, JanuaMfaProvider],
    },
  ],
  exports: [
    AuthService,
    TotpService,
    SessionService,
    GuestAuthService,
    DemoAuthService,
    SecurityConfigService,
    AUTH_PROVIDER,
    MFA_PROVIDER,
  ],
})
export class AuthModule {}
