import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../core/types/authenticated-request';

import { AmbassadorService } from './ambassador.service';
import { ApplyReferralDto } from './dto/apply-referral.dto';
import { CreateCodeDto } from './dto/create-code.dto';
import { ReferralEventDto } from './dto/referral-event.dto';
import { ReferralHmacGuard } from './guards/referral-hmac.guard';
import { ReferralService } from './referral.service';

/**
 * =============================================================================
 * Referral Controller
 * =============================================================================
 * Endpoints for the referral and ambassador system.
 *
 * ## Authentication Modes
 * - **None**: Code validation and landing page data (public)
 * - **JWT**: User-facing operations (get/create code, apply, stats, rewards)
 * - **HMAC**: Service-to-service event reporting (lifecycle transitions)
 *
 * All paths are prefixed with `/v1/referral` by the global route prefix.
 * =============================================================================
 */
@ApiTags('Referral')
@Controller('referral')
export class ReferralController {
  private readonly logger = new Logger(ReferralController.name);

  constructor(
    private readonly referralService: ReferralService,
    private readonly ambassadorService: AmbassadorService
  ) {}

  // ─── Public Endpoints (No Auth) ──────────────────────────────────────

  /**
   * Validate a referral code: check existence, active status, expiration.
   * Public endpoint for pre-signup validation.
   */
  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate a referral code (public, no auth)' })
  @ApiParam({
    name: 'code',
    description: 'The referral code to validate',
    example: 'MADFAM-A1B2C3D4',
  })
  @ApiOkResponse({ description: 'Validation result returned' })
  async validateCode(@Param('code') code: string) {
    return this.referralService.validateCode(code);
  }

  /**
   * Get landing page data for a referral code.
   * Returns referrer display name and product info without exposing
   * sensitive data. Used by referral landing pages.
   */
  @Get('landing/:code')
  @ApiOperation({ summary: 'Get referral landing page data (public, no auth)' })
  @ApiParam({ name: 'code', description: 'The referral code', example: 'MADFAM-A1B2C3D4' })
  @ApiOkResponse({ description: 'Landing page data returned' })
  async getLandingData(@Param('code') code: string) {
    return this.referralService.getLandingData(code);
  }

  // ─── JWT-Protected Endpoints ─────────────────────────────────────────

  /**
   * Get or create the authenticated user's default referral code.
   * Creates a generic MADFAM-prefixed code if the user has none.
   */
  @Get('my-code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get or create your default referral code' })
  @ApiOkResponse({ description: 'Referral code returned' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async getMyCode(@Req() req: AuthenticatedRequest) {
    return this.referralService.getOrCreateCode(req.user.id, req.user.email, 'dhanam');
  }

  /**
   * Generate a product-specific referral code.
   * Always creates a new code (does not reuse existing ones).
   */
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a product-specific referral code' })
  @ApiCreatedResponse({ description: 'New referral code created' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  async generateCode(@Req() req: AuthenticatedRequest, @Body() dto: CreateCodeDto) {
    const code = await this.referralService.generateCode(
      req.user.id,
      req.user.email,
      dto.sourceProduct,
      dto.targetProduct
    );
    return { code };
  }

  /**
   * Apply a referral code during signup.
   * Creates a Referral record linking the code to the referred user.
   */
  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply a referral code during signup' })
  @ApiOkResponse({ description: 'Referral code applied successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBadRequestResponse({ description: 'Invalid code or anti-abuse check failed' })
  async applyCode(@Req() req: AuthenticatedRequest, @Body() dto: ApplyReferralDto) {
    return this.referralService.applyCode(
      dto.code,
      req.user.email,
      dto.targetProduct,
      req.user.id,
      {
        source: dto.utmSource,
        medium: dto.utmMedium,
        campaign: dto.utmCampaign,
      },
      req.ip,
      req.headers['user-agent'] as string | undefined
    );
  }

  /**
   * Get referral dashboard statistics for the authenticated user.
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referral dashboard statistics' })
  @ApiOkResponse({ description: 'Referral statistics returned' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async getStats(@Req() req: AuthenticatedRequest) {
    return this.referralService.getStats(req.user.id);
  }

  /**
   * Get reward history for the authenticated user.
   */
  @Get('rewards')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get reward history' })
  @ApiOkResponse({ description: 'Reward history returned' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async getRewards(@Req() req: AuthenticatedRequest) {
    return this.referralService.getRewards(req.user.id);
  }

  /**
   * Get ambassador profile and tier information.
   */
  @Get('ambassador')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ambassador profile and tier' })
  @ApiOkResponse({ description: 'Ambassador profile returned' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async getAmbassadorProfile(@Req() req: AuthenticatedRequest) {
    return this.ambassadorService.getProfile(req.user.id);
  }

  // ─── HMAC-Protected Endpoint (Service-to-Service) ────────────────────

  /**
   * Report a referral lifecycle event from an ecosystem service.
   * Authenticated via HMAC-SHA256 signature in the X-Referral-Signature header.
   *
   * Event types: click, signup, trial_started, converted
   */
  @Post('events')
  @UseGuards(ReferralHmacGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Report referral lifecycle event (service-to-service, HMAC-signed)',
    description:
      'Receives lifecycle events from ecosystem services. ' +
      'Authenticated via HMAC-SHA256 signature in X-Referral-Signature header.',
  })
  @ApiHeader({
    name: 'X-Referral-Signature',
    description: 'HMAC-SHA256 hex signature of request body',
  })
  @ApiOkResponse({ description: 'Event processed' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing HMAC signature' })
  @ApiBadRequestResponse({ description: 'Invalid event payload' })
  async reportEvent(@Body() dto: ReferralEventDto) {
    return this.referralService.reportEvent(dto);
  }
}
