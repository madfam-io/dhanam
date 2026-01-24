import { Module } from '@nestjs/common';

import { LoggerModule } from '@core/logger/logger.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { SpacesModule } from '@modules/spaces/spaces.module';

import { CorrectionAggregatorService } from './correction-aggregator.service';
import { CategoryCorrectionService } from './correction.service';
import { FuzzyMatcherService } from './fuzzy-matcher.service';
import { MerchantNormalizerService } from './merchant-normalizer.service';
import { MlController } from './ml.controller';
import { ProviderSelectionService } from './provider-selection.service';
import { SplitPredictionService } from './split-prediction.service';
import { TransactionCategorizationService } from './transaction-categorization.service';

@Module({
  imports: [PrismaModule, LoggerModule, SpacesModule],
  providers: [
    // Core ML services
    FuzzyMatcherService,
    MerchantNormalizerService,
    CategoryCorrectionService,
    CorrectionAggregatorService,
    // Existing services
    ProviderSelectionService,
    TransactionCategorizationService,
    SplitPredictionService,
  ],
  controllers: [MlController],
  exports: [
    FuzzyMatcherService,
    MerchantNormalizerService,
    CategoryCorrectionService,
    CorrectionAggregatorService,
    ProviderSelectionService,
    TransactionCategorizationService,
    SplitPredictionService,
  ],
})
export class MlModule {}
