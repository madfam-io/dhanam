import { Module } from '@nestjs/common';

import { PrismaModule } from '../../../core/prisma/prisma.module';

import { CircuitBreakerService } from './circuit-breaker.service';
import { ProviderOrchestratorService } from './provider-orchestrator.service';

@Module({
  imports: [PrismaModule],
  providers: [CircuitBreakerService, ProviderOrchestratorService],
  exports: [CircuitBreakerService, ProviderOrchestratorService],
})
export class OrchestratorModule {}
