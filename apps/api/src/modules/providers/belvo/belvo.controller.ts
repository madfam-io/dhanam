import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BelvoService } from './belvo.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CreateBelvoLinkDto, BelvoWebhookDto } from './dto';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@ApiTags('providers/belvo')
@Controller('providers/belvo')
export class BelvoController {
  constructor(
    private readonly belvoService: BelvoService,
    private readonly configService: ConfigService,
  ) {}

  @Post('spaces/:spaceId/link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new Belvo link' })
  async createLink(
    @Param('spaceId') spaceId: string,
    @Body() dto: CreateBelvoLinkDto,
    @Req() req: Request,
  ) {
    return this.belvoService.createLink(spaceId, req.user.id, dto);
  }

  @Post('spaces/:spaceId/sync/:linkId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually sync accounts and transactions' })
  async syncLink(
    @Param('spaceId') spaceId: string,
    @Param('linkId') linkId: string,
    @Req() req: Request,
  ) {
    const accounts = await this.belvoService.syncAccounts(spaceId, req.user.id, linkId);
    const transactions = await this.belvoService.syncTransactions(spaceId, req.user.id, linkId);
    
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
  async deleteLink(
    @Param('linkId') linkId: string,
    @Req() req: Request,
  ) {
    await this.belvoService.deleteLink(req.user.id, linkId);
    return { success: true };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Belvo webhooks' })
  async handleWebhook(
    @Body() dto: BelvoWebhookDto,
    @Headers('belvo-signature') signature: string,
  ) {
    // Verify webhook signature
    const webhookSecret = this.configService.get<string>('BELVO_WEBHOOK_SECRET');
    if (webhookSecret) {
      const payload = JSON.stringify(dto);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    await this.belvoService.handleWebhook(dto);
    return { received: true };
  }
}