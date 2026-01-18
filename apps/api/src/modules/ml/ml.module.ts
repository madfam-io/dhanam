import { Module } from '@nestjs/common';

import { LoggerModule } from '@core/logger/logger.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { SpacesModule } from '@modules/spaces/spaces.module';

import { MlController } from './ml.controller';
import { ProviderSelectionService } from './provider-selection.service';
import { SplitPredictionService } from './split-prediction.service';
import { TransactionCategorizationService } from './transaction-categorization.service';

@Module({
  imports: [PrismaModule, LoggerModule, SpacesModule],
  providers: [ProviderSelectionService, TransactionCategorizationService, SplitPredictionService],
  controllers: [MlController],
  exports: [ProviderSelectionService, TransactionCategorizationService, SplitPredictionService],
})
export class MlModule {}
