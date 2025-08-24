import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { SpaceGuard } from '../../spaces/guards/space.guard';
import { BlockchainService } from './blockchain.service';
import { AddWalletDto, ImportWalletDto } from './dto';
import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { User } from '@dhanam/shared';

@ApiTags('Blockchain Provider')
@Controller('providers/blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Post('spaces/:spaceId/wallets')
  @UseGuards(JwtAuthGuard, SpaceGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a blockchain wallet to space' })
  @ApiResponse({ status: 201, description: 'Wallet added successfully' })
  async addWallet(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @Body() dto: AddWalletDto,
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
  @ApiResponse({ status: 201, description: 'Wallets imported successfully' })
  async importWallets(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @Body() dto: ImportWalletDto,
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
  @ApiResponse({ status: 200, description: 'Sync initiated successfully' })
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
  @ApiResponse({ status: 200, description: 'Wallet removed successfully' })
  async removeWallet(
    @Param('accountId') accountId: string,
    @CurrentUser() user: User,
  ) {
    await this.blockchainService.removeWallet(accountId, user.id);
    return {
      message: 'Wallet removed successfully',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check blockchain service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  getHealth() {
    return {
      service: 'blockchain',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      supportedCurrencies: ['eth', 'btc'],
    };
  }
}