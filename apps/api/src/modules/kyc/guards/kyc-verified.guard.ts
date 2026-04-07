import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';

import { KycService } from '../kyc.service';

/**
 * =============================================================================
 * KYC Verified Guard
 * =============================================================================
 * NestJS CanActivate guard that enforces CNBV KYC/AML verification.
 *
 * Usage:
 * ```ts
 * @UseGuards(JwtAuthGuard, KycVerifiedGuard)
 * @Post('orders')
 * async createOrder(...) { ... }
 * ```
 *
 * This guard should be applied to endpoints that execute financial transactions
 * or access regulated financial services under CNBV rules.
 * =============================================================================
 */
@Injectable()
export class KycVerifiedGuard implements CanActivate {
  private readonly logger = new Logger(KycVerifiedGuard.name);

  constructor(private kycService: KycService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('KycVerifiedGuard: No user found in request');
      throw new ForbiddenException('Authentication required for KYC-gated operations');
    }

    const isVerified = await this.kycService.isVerified(user.id);

    if (!isVerified) {
      this.logger.log(`User ${user.id} attempted KYC-gated operation without verified identity`);
      throw new ForbiddenException(
        'Identity verification is required before performing this operation. ' +
          'Please complete KYC verification at /kyc/start'
      );
    }

    return true;
  }
}
