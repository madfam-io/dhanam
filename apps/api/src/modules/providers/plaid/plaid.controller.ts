import { User } from '@dhanam/shared';
import {
  Controller,
  Post,
  Body,
  Headers,
  UseGuards,
  Get,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';

import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { SpaceGuard } from '../../spaces/guards/space.guard';

import { CreatePlaidLinkDto, PlaidWebhookDto } from './dto';
import { PlaidService } from './plaid.service';

@ApiTags('Plaid Provider')
@Controller('providers/plaid')
export class PlaidController {
  constructor(private readonly plaidService: PlaidService) {}

  @Post('link-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Plaid Link token' })
  @ApiCreatedResponse({ description: 'Link token created successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async createLinkToken(@CurrentUser() user: User) {
    const result = await this.plaidService.createLinkToken(user.id);
    return {
      linkToken: result.linkToken,
      expiration: result.expiration,
    };
  }

  @Post('spaces/:spaceId/link')
  @UseGuards(JwtAuthGuard, SpaceGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link Plaid account to space' })
  @ApiParam({ name: 'spaceId', description: 'Space ID to link the account to' })
  @ApiCreatedResponse({ description: 'Account linked successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  async createLink(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @Body() createLinkDto: CreatePlaidLinkDto
  ) {
    const result = await this.plaidService.createLink(spaceId, user.id, createLinkDto);
    return {
      message: 'Plaid account linked successfully',
      accountsCount: result.accounts.length,
      accounts: result.accounts,
    };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Plaid webhook' })
  @ApiOkResponse({ description: 'Webhook processed successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body or missing webhook signature' })
  async handleWebhook(
    @Body() webhookData: PlaidWebhookDto,
    @Headers('plaid-verification') signature: string
  ) {
    if (!signature) {
      throw new BadRequestException('Missing webhook signature');
    }

    await this.plaidService.handleWebhook(webhookData, signature);

    return {
      message: 'Webhook processed successfully',
    };
  }

  @Get('spaces/:spaceId/bills/upcoming')
  @UseGuards(JwtAuthGuard, SpaceGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get upcoming bills for a space',
    description: 'Returns liability accounts (credit cards, loans) with upcoming payment due dates',
  })
  @ApiParam({ name: 'spaceId', description: 'Space ID to get upcoming bills for' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days ahead to look (default: 30)',
  })
  @ApiOkResponse({ description: 'Upcoming bills retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  async getUpcomingBills(
    @Param('spaceId') spaceId: string,
    @CurrentUser() _user: User,
    @Query('days') days?: string
  ) {
    const daysAhead = days ? parseInt(days, 10) : 30;
    const bills = await this.plaidService.getUpcomingBills(spaceId, daysAhead);

    return {
      bills,
      count: bills.length,
      overdueCount: bills.filter((b) => b.isOverdue).length,
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check Plaid service health' })
  @ApiOkResponse({ description: 'Service health status' })
  getHealth() {
    return {
      service: 'plaid',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
