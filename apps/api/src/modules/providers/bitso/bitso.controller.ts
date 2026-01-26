import { User } from '@dhanam/shared';
import {
  Controller,
  Post,
  Body,
  Headers,
  UseGuards,
  Get,
  Param,
  BadRequestException,
  Logger,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { Redis } from 'ioredis';

import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { processWebhook, createWebhookResponse } from '@core/utils/webhook.util';

import { SpaceGuard } from '../../spaces/guards/space.guard';

import { BitsoService } from './bitso.service';
import { ConnectBitsoDto, BitsoWebhookDto } from './dto';

@ApiTags('Bitso Provider')
@Controller('providers/bitso')
export class BitsoController {
  private readonly logger = new Logger(BitsoController.name);
  private readonly webhookSecret: string;
  private redis: Redis | null = null;

  constructor(
    private readonly bitsoService: BitsoService,
    private readonly configService: ConfigService
  ) {
    this.webhookSecret = this.configService.get('BITSO_WEBHOOK_SECRET', '');

    // Initialize Redis for idempotency (optional)
    const redisUrl = this.configService.get('REDIS_URL');
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, { lazyConnect: true });
        this.redis.connect().catch(() => {
          this.logger.warn('Redis not available for webhook idempotency');
          this.redis = null;
        });
      } catch {
        this.logger.warn('Failed to initialize Redis for webhook idempotency');
      }
    }
  }

  @Post('spaces/:spaceId/connect')
  @UseGuards(JwtAuthGuard, SpaceGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Connect Bitso account to space' })
  @ApiParam({ name: 'spaceId', description: 'Space ID to connect the account to' })
  @ApiCreatedResponse({ description: 'Account connected successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  async connectAccount(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @Body() connectDto: ConnectBitsoDto
  ) {
    const result = await this.bitsoService.connectAccount(spaceId, user.id, connectDto);
    return {
      message: result.message,
      accountsCount: result.accounts.length,
      accounts: result.accounts,
    };
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync Bitso portfolio' })
  @ApiOkResponse({ description: 'Portfolio synced successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async syncPortfolio(@CurrentUser() user: User) {
    await this.bitsoService.syncPortfolio(user.id);
    return {
      message: 'Portfolio sync initiated successfully',
    };
  }

  @Get('portfolio')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Bitso portfolio summary' })
  @ApiOkResponse({ description: 'Portfolio summary retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async getPortfolioSummary(@CurrentUser() user: User) {
    const summary = await this.bitsoService.getPortfolioSummary(user.id);
    return {
      ...summary,
      currency: 'USD',
      lastUpdated: new Date().toISOString(),
    };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Bitso webhook' })
  @ApiOkResponse({ description: 'Webhook processed successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body or missing webhook signature' })
  async handleWebhook(
    @Body() webhookData: BitsoWebhookDto,
    @Headers('bitso-signature') signature: string,
    @Req() request: FastifyRequest
  ) {
    // Get raw body for signature verification if available
    const rawBody = (request as any).rawBody || JSON.stringify(webhookData);

    if (!signature) {
      this.logger.warn('Bitso webhook received without signature');
      throw new BadRequestException('Missing webhook signature');
    }

    const result = await processWebhook(
      rawBody,
      signature,
      {
        provider: 'bitso',
        secret: this.webhookSecret,
        redis: this.redis || undefined,
        logger: this.logger,
      },
      async () => {
        await this.bitsoService.handleWebhook(webhookData, signature);
      }
    );

    // Always return 200 OK after signature verification to prevent retries
    return createWebhookResponse(result);
  }

  @Get('health')
  @ApiOperation({ summary: 'Check Bitso service health' })
  @ApiOkResponse({ description: 'Service health status' })
  getHealth() {
    return {
      service: 'bitso',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
