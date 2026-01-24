import { Module, OnModuleInit } from '@nestjs/common';

import { BelvoModule } from './belvo/belvo.module';
import { BelvoService } from './belvo/belvo.service';
import { BitsoModule } from './bitso/bitso.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { ConnectionHealthModule } from './connection-health/connection-health.module';
import { FinicityModule } from './finicity/finicity.module';
import { FinicityService } from './finicity/finicity.service';
import { MxModule } from './mx/mx.module';
import { MxService } from './mx/mx.service';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { ProviderOrchestratorService } from './orchestrator/provider-orchestrator.service';
import { PlaidModule } from './plaid/plaid.module';
import { PlaidService } from './plaid/plaid.service';

@Module({
  imports: [
    OrchestratorModule,
    BelvoModule,
    PlaidModule,
    MxModule,
    FinicityModule,
    BitsoModule,
    BlockchainModule,
    ConnectionHealthModule,
  ],
  exports: [
    OrchestratorModule,
    BelvoModule,
    PlaidModule,
    MxModule,
    FinicityModule,
    BitsoModule,
    BlockchainModule,
    ConnectionHealthModule,
  ],
})
export class ProvidersModule implements OnModuleInit {
  constructor(
    private orchestrator: ProviderOrchestratorService,
    private plaidService: PlaidService,
    private belvoService: BelvoService,
    private mxService: MxService,
    private finicityService: FinicityService
  ) {}

  onModuleInit() {
    // Register all provider implementations with the orchestrator
    this.orchestrator.registerProvider(this.plaidService as any);
    this.orchestrator.registerProvider(this.belvoService as any);
    this.orchestrator.registerProvider(this.mxService);
    this.orchestrator.registerProvider(this.finicityService);
  }
}
