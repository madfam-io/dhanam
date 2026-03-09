import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * =============================================================================
 * JWT Authentication Guard (Galaxy Ecosystem)
 * =============================================================================
 * When JANUA_ENABLED=true, tries the 'janua' strategy (RS256 via JWKS) first.
 * If that fails, falls back to the local 'jwt' strategy (HS256) to support
 * demo tokens issued by the Dhanam API itself.
 *
 * When JANUA_ENABLED=false, uses only the local 'jwt' strategy.
 * =============================================================================
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('janua') {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly januaEnabled = process.env.JANUA_ENABLED === 'true';

  constructor() {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.januaEnabled) {
      const localGuard = new (AuthGuard('jwt'))();
      return localGuard.canActivate(context) as Promise<boolean>;
    }

    // Janua mode: try Janua RS256 first, fall back to local HS256 for demo tokens
    try {
      return await (super.canActivate(context) as Promise<boolean>);
    } catch (err) {
      this.logger.debug('Janua strategy failed, trying local JWT strategy');
      try {
        const localGuard = new (AuthGuard('jwt'))();
        return await (localGuard.canActivate(context) as Promise<boolean>);
      } catch {
        // Both strategies failed — throw original Janua error
        throw err;
      }
    }
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      this.logger.warn(
        `Authentication failed: ${err?.message || info?.message || 'Unknown error'}`
      );
    }
    return super.handleRequest(err, user, info, context);
  }
}
