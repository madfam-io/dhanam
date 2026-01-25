import { User } from '@dhanam/shared';
import { Controller, Post, Body, UseGuards, Get, Param, Delete } from '@nestjs/common';
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

import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { SpaceGuard } from '../../spaces/guards/space.guard';

import { BlockchainService } from './blockchain.service';
import { AddWalletDto, ImportWalletDto } from './dto';

@ApiTags('Blockchain Provider')
@Controller('providers/blockchain')
@ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Post('spaces/:spaceId/wallets')
  @UseGuards(JwtAuthGuard, SpaceGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a blockchain wallet to space' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiCreatedResponse({ description: 'Wallet added successfully' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiBadRequestResponse({ description: 'Invalid wallet address' })
  async addWallet(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @Body() dto: AddWalletDto
  ) {
    const result = await this.blockchainService.addWallet(spaceId, user.id, dto);
    return {
      message: result.message,
      account: result.account,
    };
  }

  @Post('spaces/:spaceId/import')
  @UseGuards(JwtAuthGuard, SpaceGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import wallets from extended public key' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiCreatedResponse({ description: 'Wallets imported successfully' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiBadRequestResponse({ description: 'Invalid extended public key' })
  async importWallets(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @Body() dto: ImportWalletDto
  ) {
    const result = await this.blockchainService.importWallet(spaceId, user.id, dto);
    return {
      message: result.message,
      accountsCount: result.accounts.length,
      accounts: result.accounts,
    };
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync all blockchain wallets' })
  @ApiOkResponse({ description: 'Sync initiated successfully' })
  async syncWallets(@CurrentUser() user: User) {
    await this.blockchainService.syncWallets(user.id);
    return {
      message: 'Wallet sync initiated successfully',
    };
  }

  @Delete('wallets/:accountId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a blockchain wallet' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiOkResponse({ description: 'Wallet removed successfully' })
  @ApiNotFoundResponse({ description: 'Wallet not found' })
  async removeWallet(@Param('accountId') accountId: string, @CurrentUser() user: User) {
    await this.blockchainService.removeWallet(accountId, user.id);
    return {
      message: 'Wallet removed successfully',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check blockchain service health' })
  @ApiOkResponse({ description: 'Service health status' })
  getHealth() {
    return {
      service: 'blockchain',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      supportedCurrencies: ['eth', 'btc'],
    };
  }
}
