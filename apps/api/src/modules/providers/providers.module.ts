import { Module } from '@nestjs/common';
import { BelvoModule } from './belvo/belvo.module';
import { PlaidModule } from './plaid/plaid.module';
import { BitsoModule } from './bitso/bitso.module';
import { BlockchainModule } from './blockchain/blockchain.module';

@Module({
  imports: [BelvoModule, PlaidModule, BitsoModule, BlockchainModule],
  exports: [BelvoModule, PlaidModule, BitsoModule, BlockchainModule],
})
export class ProvidersModule {}