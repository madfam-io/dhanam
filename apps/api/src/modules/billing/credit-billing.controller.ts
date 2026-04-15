import * as crypto from 'crypto';

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
  RawBodyRequest,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiHeader,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../core/types/authenticated-request';

import { RecordUsageDto, UsageQueryDto } from './dto';
import { UsageMeteringService } from './services/usage-metering.service';

/**
 * Credit Billing Controller
 *
 * Exposes endpoints for the credit-based usage metering system.
 * Two authentication modes:
 *
 * 1. **JWT auth** — for dashboard/user-facing balance and usage queries
 * 2. **HMAC signature** — for service-to-service usage reporting
 *
 * ## HMAC Verification
 * Services sign the JSON request body with `BILLING_WEBHOOK_SECRET` using
 * HMAC-SHA256 and pass the hex digest in the `X-Billing-Signature` header.
 * This prevents unauthorized services from reporting fake usage.
 *
 * @see UsageMeteringService - Business logic for credit tracking
 */
@ApiTags('Credit Billing')
@Controller('billing/credits')
export class CreditBillingController {
  private readonly logger = new Logger(CreditBillingController.name);

  constructor(
    private readonly usageMetering: UsageMeteringService,
    private readonly config: ConfigService
  ) {}

  /**
   * Get the credit balance for the authenticated user's org.
   */
  @Get('balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get credit balance for the authenticated org' })
  @ApiOkResponse({ description: 'Credit balance retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async getBalance(@Req() req: AuthenticatedRequest) {
    return this.usageMetering.getBalance(req.user.id);
  }

  /**
   * Record a usage event (service-to-service, HMAC-signed).
   *
   * Services include the `X-Billing-Signature` header with the HMAC-SHA256
   * hex digest of the raw request body, computed with `BILLING_WEBHOOK_SECRET`.
   */
  @Post('usage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record credit usage (service-to-service, HMAC-signed)' })
  @ApiHeader({ name: 'X-Billing-Signature', description: 'HMAC-SHA256 hex signature of body' })
  @ApiCreatedResponse({ description: 'Usage recorded successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing HMAC signature' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  async recordUsage(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-billing-signature') signature: string,
    @Body() dto: RecordUsageDto
  ) {
    // Verify HMAC signature
    this.verifyHmacSignature(req, signature);

    return this.usageMetering.recordUsage(
      dto.orgId,
      dto.service,
      dto.operation,
      dto.credits,
      dto.idempotencyKey
    );
  }

  /**
   * Get usage breakdown for the authenticated user's org.
   */
  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get credit usage breakdown for the authenticated org' })
  @ApiOkResponse({ description: 'Usage breakdown retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async getUsage(@Req() req: AuthenticatedRequest, @Query() query: UsageQueryDto) {
    const startDate = query.start ? new Date(query.start) : undefined;
    const endDate = query.end ? new Date(query.end) : undefined;

    return this.usageMetering.getUsage(req.user.id, startDate, endDate, query.service);
  }

  // ─── Internal ──────────────────────────────────────────────────────────

  /**
   * Verify the HMAC-SHA256 signature on a service-to-service request.
   *
   * Uses timing-safe comparison to prevent timing attacks.
   *
   * @throws UnauthorizedException if the signature is missing, invalid, or
   *         the BILLING_WEBHOOK_SECRET is not configured.
   */
  private verifyHmacSignature(req: RawBodyRequest<Request>, signature: string): void {
    if (!signature) {
      throw new UnauthorizedException('Missing X-Billing-Signature header');
    }

    const secret = this.config.get<string>('BILLING_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.error('BILLING_WEBHOOK_SECRET not configured');
      throw new UnauthorizedException('Billing signature verification not configured');
    }

    const rawBody =
      typeof req.rawBody === 'string'
        ? req.rawBody
        : req.rawBody
          ? req.rawBody.toString()
          : JSON.stringify(req.body);

    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (sigBuffer.length !== expectedBuffer.length) {
      throw new UnauthorizedException('Invalid billing signature');
    }

    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      throw new UnauthorizedException('Invalid billing signature');
    }
  }
}
