import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SpacesModule } from '../spaces/spaces.module';

import { ManualAssetsController } from './manual-assets.controller';
import { ManualAssetsService } from './manual-assets.service';
import { PEAnalyticsService } from './pe-analytics.service';

@Module({
  imports: [PrismaModule, SpacesModule],
  controllers: [ManualAssetsController],
  providers: [ManualAssetsService, PEAnalyticsService],
  exports: [ManualAssetsService, PEAnalyticsService],
})
export class ManualAssetsModule {}
