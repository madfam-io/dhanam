import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

import { GamingService } from './gaming.service';
import { MetaversePlatform } from './interfaces/platform.interface';
import { SandboxService } from './sandbox.service';

@Controller('gaming')
@UseGuards(JwtAuthGuard)
export class GamingController {
  constructor(
    private readonly gamingService: GamingService,
    private readonly sandboxService: SandboxService
  ) {}

  @Get('portfolio')
  async getPortfolio(@Query('spaceId') spaceId: string) {
    return this.gamingService.getAggregatedPortfolio(spaceId);
  }

  @Get('platforms')
  async getPlatforms() {
    return this.gamingService.getSupportedPlatforms();
  }

  @Get('earnings')
  async getEarnings(@Query('spaceId') spaceId: string, @Query('period') period?: string) {
    return this.gamingService.getEarnings(spaceId, period);
  }

  @Get('nfts')
  async getNfts(@Query('spaceId') spaceId: string) {
    return this.gamingService.getNftInventory(spaceId);
  }

  @Get(':platform/positions')
  async getPlatformPositions(
    @Param('platform') platform: MetaversePlatform,
    @Query('spaceId') spaceId: string
  ) {
    return this.gamingService.getPlatformPositions(platform, spaceId);
  }

  // Legacy Sandbox-specific endpoints
  @Get('sandbox/land-floor-price')
  async getLandFloorPrice() {
    return this.sandboxService.getLandFloorPrice();
  }

  @Get('sandbox/staking-apy')
  async getStakingApy() {
    return this.sandboxService.getStakingApy();
  }

  @Get('positions')
  async getGamingPositions(@Query('spaceId') spaceId: string) {
    return this.sandboxService.getGamingPositions(spaceId);
  }
}
