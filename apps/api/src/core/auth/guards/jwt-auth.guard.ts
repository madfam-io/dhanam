import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * =============================================================================
 * JWT Authentication Guard (Galaxy Ecosystem)
 * =============================================================================
 * Selects authentication strategy based on JANUA_ENABLED environment variable:
 *
 * - JANUA_ENABLED=true  → Uses 'janua' strategy (RS256 via JWKS)
 * - JANUA_ENABLED=false → Uses 'jwt' strategy (HS256 local)
 *
 * This enables seamless migration from standalone to Galaxy ecosystem.
 * =============================================================================
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard(
  process.env.JANUA_ENABLED === 'true' ? 'janua' : 'jwt'
) {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor() {
    super();
    const strategy = process.env.JANUA_ENABLED === 'true' ? 'janua' : 'jwt';
    this.logger.log(`JwtAuthGuard using strategy: ${strategy}`);
  }

  canActivate(context: ExecutionContext) {
    // Add any custom activation logic here
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Log authentication failures for debugging
    if (err || !user) {
      this.logger.warn(
        `Authentication failed: ${err?.message || info?.message || 'Unknown error'}`
      );
    }
    return super.handleRequest(err, user, info);
  }
}
