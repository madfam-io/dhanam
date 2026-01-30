import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { RedisModule } from '../../core/redis/redis.module';

import { ArtsyAdapter } from './adapters/artsy.adapter';
import { HagertyAdapter } from './adapters/hagerty.adapter';
import { KicksDbAdapter } from './adapters/kicksdb.adapter';
import { PcgsAdapter } from './adapters/pcgs.adapter';
import { PsaAdapter } from './adapters/psa.adapter';

import { WatchChartsAdapter } from './adapters/watchcharts.adapter';
import { WineSearcherAdapter } from './adapters/wine-searcher.adapter';
import { CollectiblesValuationProcessor } from './collectibles-valuation.processor';
import { CollectiblesValuationService } from './collectibles-valuation.service';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [
    // Adapters
    ArtsyAdapter,
    WatchChartsAdapter,
    WineSearcherAdapter,
    PcgsAdapter,
    PsaAdapter,
    HagertyAdapter,
    KicksDbAdapter,
    // Service & Processor
    CollectiblesValuationService,
    CollectiblesValuationProcessor,
  ],
  exports: [CollectiblesValuationService, CollectiblesValuationProcessor],
})
export class CollectiblesValuationModule {}
