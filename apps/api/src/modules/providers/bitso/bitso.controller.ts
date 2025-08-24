import {
  Controller,
  Post,
  Body,
  Headers,
  UseGuards,
  Get,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SpaceGuard } from '../../spaces/guards/space.guard';
import { BitsoService } from './bitso.service';
import { ConnectBitsoDto, BitsoWebhookDto } from './dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '@dhanam/shared';

@ApiTags('Bitso Provider')
@Controller('providers/bitso')
export class BitsoController {
  constructor(private readonly bitsoService: BitsoService) {}

  @Post('spaces/:spaceId/connect')
  @UseGuards(JwtAuthGuard, SpaceGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Connect Bitso account to space' })
  @ApiResponse({ status: 201, description: 'Account connected successfully' })
  async connectAccount(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @Body() connectDto: ConnectBitsoDto,
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
  @ApiResponse({ status: 200, description: 'Portfolio synced successfully' })
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
  @ApiResponse({ status: 200, description: 'Portfolio summary retrieved successfully' })
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
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Body() webhookData: BitsoWebhookDto,
    @Headers('bitso-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing webhook signature');
    }

    await this.bitsoService.handleWebhook(webhookData, signature);
    
    return {
      message: 'Webhook processed successfully',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check Bitso service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  getHealth() {
    return {
      service: 'bitso',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}