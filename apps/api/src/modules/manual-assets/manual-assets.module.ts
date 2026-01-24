import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { ZillowModule } from '../integrations/zillow/zillow.module';
import { SpacesModule } from '../spaces/spaces.module';
import { StorageModule } from '../storage/storage.module';

import { DocumentService } from './document.service';
import { ManualAssetsController } from './manual-assets.controller';
import { ManualAssetsService } from './manual-assets.service';
import { PEAnalyticsService } from './pe-analytics.service';
import { RealEstateValuationService } from './real-estate-valuation.service';

@Module({
  imports: [PrismaModule, SpacesModule, StorageModule, ZillowModule],
  controllers: [ManualAssetsController],
  providers: [ManualAssetsService, PEAnalyticsService, DocumentService, RealEstateValuationService],
  exports: [ManualAssetsService, PEAnalyticsService, DocumentService, RealEstateValuationService],
})
export class ManualAssetsModule {}
