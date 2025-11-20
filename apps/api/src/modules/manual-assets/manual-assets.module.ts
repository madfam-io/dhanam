import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SpacesModule } from '../spaces/spaces.module';

import { ManualAssetsService } from './manual-assets.service';
import { ManualAssetsController } from './manual-assets.controller';

@Module({
  imports: [PrismaModule, SpacesModule],
  controllers: [ManualAssetsController],
  providers: [ManualAssetsService],
  exports: [ManualAssetsService],
})
export class ManualAssetsModule {}
