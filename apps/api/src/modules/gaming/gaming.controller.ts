import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

import { SandboxService } from './sandbox.service';

@Controller('gaming')
@UseGuards(JwtAuthGuard)
export class GamingController {
  constructor(private readonly sandboxService: SandboxService) {}

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
