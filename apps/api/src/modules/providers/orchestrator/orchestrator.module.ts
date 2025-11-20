import { Module, forwardRef } from '@nestjs/common';

import { PrismaModule } from '../../../core/prisma/prisma.module';
import { LoggerModule } from '../../../core/logger/logger.module';

import { CircuitBreakerService } from './circuit-breaker.service';
import { ProviderOrchestratorService } from './provider-orchestrator.service';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    forwardRef(() => require('../../ml/ml.module').MlModule),
  ],
  providers: [CircuitBreakerService, ProviderOrchestratorService],
  exports: [CircuitBreakerService, ProviderOrchestratorService],
})
export class OrchestratorModule {}
