import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Headers,
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

import { CurrentUser, AuthenticatedUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { processWebhook, createWebhookResponse } from '@core/utils/webhook.util';

import { ProviderConnectionGuard } from '../../billing/guards/provider-connection.guard';

import { BelvoService } from './belvo.service';
import { CreateBelvoLinkDto, BelvoWebhookDto } from './dto';

@ApiTags('providers/belvo')
@Controller('providers/belvo')
export class BelvoController {
  private readonly logger = new Logger(BelvoController.name);
  private readonly webhookSecret: string;
  private redis: Redis | null = null;

  constructor(
    private readonly belvoService: BelvoService,
    private readonly configService: ConfigService
  ) {
    this.webhookSecret = this.configService.get('BELVO_WEBHOOK_SECRET', '');

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

  @Post('spaces/:spaceId/link')
  @UseGuards(JwtAuthGuard, ProviderConnectionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new Belvo link' })
  @ApiParam({ name: 'spaceId', description: 'Space ID to link the account to' })
  @ApiCreatedResponse({ description: 'Belvo link created successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  async createLink(
    @Param('spaceId') spaceId: string,
    @Body() dto: CreateBelvoLinkDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.belvoService.createLink(spaceId, user.userId, dto);
  }

  @Post('spaces/:spaceId/sync/:linkId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually sync accounts and transactions' })
  @ApiParam({ name: 'spaceId', description: 'Space ID containing the link' })
  @ApiParam({ name: 'linkId', description: 'Belvo link ID to sync' })
  @ApiOkResponse({ description: 'Sync completed successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space or link' })
  @ApiNotFoundResponse({ description: 'Space or link not found' })
  async syncLink(
    @Param('spaceId') spaceId: string,
    @Param('linkId') linkId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const accounts = await this.belvoService.syncAccounts(spaceId, user.userId, linkId);
    const transactions = await this.belvoService.syncTransactions(spaceId, user.userId, linkId);

    return {
      accounts: accounts.length,
      transactions: transactions.length,
      lastSyncedAt: new Date(),
    };
  }

  @Delete('link/:linkId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a Belvo link' })
  @ApiParam({ name: 'linkId', description: 'Belvo link ID to delete' })
  @ApiOkResponse({ description: 'Belvo link deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this link' })
  @ApiNotFoundResponse({ description: 'Link not found' })
  async deleteLink(@Param('linkId') linkId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.belvoService.deleteLink(user.userId, linkId);
    return { success: true };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Belvo webhooks' })
  @ApiOkResponse({ description: 'Webhook processed successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body or missing webhook signature' })
  async handleWebhook(
    @Body() dto: BelvoWebhookDto,
    @Headers('belvo-signature') signature: string,
    @Req() request: FastifyRequest
  ) {
    // Get raw body for signature verification if available
    const rawBody = (request as any).rawBody || JSON.stringify(dto);

    if (!signature) {
      this.logger.warn('Belvo webhook received without signature');
      throw new BadRequestException('Missing webhook signature');
    }

    const result = await processWebhook(
      rawBody,
      signature,
      {
        provider: 'belvo',
        secret: this.webhookSecret,
        redis: this.redis || undefined,
        logger: this.logger,
      },
      async () => {
        await this.belvoService.handleWebhook(dto, signature);
      }
    );

    // Always return 200 OK after signature verification to prevent retries
    return createWebhookResponse(result);
  }
}
