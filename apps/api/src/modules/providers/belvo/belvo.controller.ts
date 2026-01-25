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
