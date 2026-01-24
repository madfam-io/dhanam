import { Module, forwardRef } from '@nestjs/common';

import { LoggerModule } from '../../../core/logger/logger.module';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { MlModule } from '../../ml/ml.module';

import { CircuitBreakerService } from './circuit-breaker.service';
import { ProviderOrchestratorService } from './provider-orchestrator.service';
import { RateLimiterService } from './rate-limiter.service';

@Module({
  imports: [PrismaModule, LoggerModule, forwardRef(() => MlModule)],
  providers: [CircuitBreakerService, ProviderOrchestratorService, RateLimiterService],
  exports: [CircuitBreakerService, ProviderOrchestratorService, RateLimiterService],
})
export class OrchestratorModule {}
