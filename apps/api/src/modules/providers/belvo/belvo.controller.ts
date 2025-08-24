import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser, AuthenticatedUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { BelvoService } from './belvo.service';
import { CreateBelvoLinkDto, BelvoWebhookDto } from './dto';

@ApiTags('providers/belvo')
@Controller('providers/belvo')
export class BelvoController {
  constructor(private readonly belvoService: BelvoService) {}

  @Post('spaces/:spaceId/link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new Belvo link' })
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
  async deleteLink(@Param('linkId') linkId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.belvoService.deleteLink(user.userId, linkId);
    return { success: true };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Belvo webhooks' })
  async handleWebhook(@Body() dto: BelvoWebhookDto, @Headers('belvo-signature') signature: string) {
    if (!signature) {
      throw new BadRequestException('Missing webhook signature');
    }

    await this.belvoService.handleWebhook(dto, signature);
    return {
      message: 'Webhook processed successfully',
    };
  }
}
