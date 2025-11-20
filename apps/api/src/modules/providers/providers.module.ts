import { Module } from '@nestjs/common';

import { BelvoModule } from './belvo/belvo.module';
import { BitsoModule } from './bitso/bitso.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { MxModule } from './mx/mx.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { PlaidModule } from './plaid/plaid.module';

@Module({
  imports: [
    OrchestratorModule,
    BelvoModule,
    PlaidModule,
    MxModule,
    BitsoModule,
    BlockchainModule,
  ],
  exports: [
    OrchestratorModule,
    BelvoModule,
    PlaidModule,
    MxModule,
    BitsoModule,
    BlockchainModule,
  ],
})
export class ProvidersModule {}
