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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

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
  @ApiResponse({ status: 201, description: 'Link token created successfully' })
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
  @ApiResponse({ status: 201, description: 'Account linked successfully' })
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
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
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
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days ahead to look (default: 30)',
  })
  @ApiResponse({ status: 200, description: 'Upcoming bills retrieved successfully' })
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
  @ApiResponse({ status: 200, description: 'Service health status' })
  getHealth() {
    return {
      service: 'plaid',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
