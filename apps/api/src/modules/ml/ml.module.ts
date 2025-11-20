import { Module } from '@nestjs/common';

import { PrismaModule } from '@core/prisma/prisma.module';
import { LoggerModule } from '@core/logger/logger.module';

import { ProviderSelectionService } from './provider-selection.service';
import { TransactionCategorizationService } from './transaction-categorization.service';
import { SplitPredictionService } from './split-prediction.service';
import { MlController } from './ml.controller';

@Module({
  imports: [PrismaModule, LoggerModule],
  providers: [
    ProviderSelectionService,
    TransactionCategorizationService,
    SplitPredictionService,
  ],
  controllers: [MlController],
  exports: [
    ProviderSelectionService,
    TransactionCategorizationService,
    SplitPredictionService,
  ],
})
export class MlModule {}
