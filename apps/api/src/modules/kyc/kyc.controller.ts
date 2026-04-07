import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { ThrottleAuthGuard } from '../../core/security/guards/throttle-auth.guard';
import { AuthenticatedRequest } from '../../core/types/authenticated-request';

import { StartVerificationDto, UploadDocumentDto, MetaMapWebhookPayloadDto } from './dto';
import { KycService } from './kyc.service';
import { MetaMapProvider } from './metamap.provider';

/**
 * =============================================================================
 * KYC / AML Controller
 * =============================================================================
 * Endpoints for CNBV-compliant identity verification via MetaMap.
 *
 * Authenticated endpoints (require JwtAuthGuard):
 * - POST /kyc/start      — Initiate a new verification flow
 * - GET  /kyc/status      — Get current verification status
 * - POST /kyc/documents   — Upload verification documents
 *
 * Public endpoint (webhook):
 * - POST /kyc/webhook     — Receive MetaMap webhook callbacks (HMAC verified)
 * =============================================================================
 */
@ApiTags('KYC')
@Controller('kyc')
export class KycController {
  private readonly logger = new Logger(KycController.name);

  constructor(
    private kycService: KycService,
    private metaMapProvider: MetaMapProvider
  ) {}

  /**
   * Start a new identity verification flow.
   * Returns a MetaMap verification URL that the client should redirect to.
   */
  @Post('start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 per minute — prevent abuse
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate KYC identity verification flow' })
  @ApiCreatedResponse({
    description: 'Verification flow created; returns MetaMap verification URL',
  })
  @ApiConflictResponse({ description: 'User is already verified' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async startVerification(@Req() req: AuthenticatedRequest, @Body() dto: StartVerificationDto) {
    return this.kycService.initiateVerification(req.user.id, dto.redirectUrl, dto.countryCode);
  }

  /**
   * Get the current KYC verification status for the authenticated user.
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current KYC verification status' })
  @ApiOkResponse({ description: 'Current verification status and details' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async getStatus(@Req() req: AuthenticatedRequest) {
    return this.kycService.getStatus(req.user.id);
  }

  /**
   * Upload a verification document for the active verification flow.
   */
  @Post('documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 per minute
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a verification document' })
  @ApiCreatedResponse({ description: 'Document uploaded and attached to verification' })
  @ApiBadRequestResponse({ description: 'Duplicate document type or no active verification' })
  @ApiForbiddenResponse({ description: 'No active verification flow' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async uploadDocument(@Req() req: AuthenticatedRequest, @Body() dto: UploadDocumentDto) {
    return this.kycService.uploadDocument(req.user.id, dto);
  }

  /**
   * MetaMap webhook callback endpoint.
   *
   * This is a public endpoint (no JWT required) but is secured via HMAC-SHA256
   * signature verification of the request body using the shared webhook secret.
   *
   * MetaMap sends the signature in the `x-signature` header.
   */
  @Post('webhook')
  @UseGuards(ThrottleAuthGuard)
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 per minute for webhook bursts
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle MetaMap webhook callbacks (HMAC verified)' })
  @ApiOkResponse({ description: 'Webhook processed successfully' })
  @ApiBadRequestResponse({ description: 'Invalid webhook signature or payload' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-signature') signature: string,
    @Body() payload: MetaMapWebhookPayloadDto
  ) {
    // Verify HMAC-SHA256 signature
    const rawBody =
      (req as unknown as { rawBody?: Buffer }).rawBody?.toString() || JSON.stringify(payload);

    if (!this.metaMapProvider.verifyWebhookSignature(rawBody, signature || '')) {
      this.logger.error(`MetaMap webhook signature verification failed for flow ${payload.flowId}`);
      return { received: false, error: 'Invalid signature' };
    }

    this.logger.log(`Received MetaMap webhook: ${payload.eventName} for flow ${payload.flowId}`);

    try {
      await this.kycService.processWebhook(payload);
    } catch (error) {
      this.logger.error(
        `Error processing MetaMap webhook: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { received: false, error: (error as Error).message };
    }

    return { received: true, event: payload.eventName };
  }
}
