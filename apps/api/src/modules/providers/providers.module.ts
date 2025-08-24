import { Module } from '@nestjs/common';
import { BelvoModule } from './belvo/belvo.module';
import { PlaidModule } from './plaid/plaid.module';
import { BitsoModule } from './bitso/bitso.module';

@Module({
  imports: [BelvoModule, PlaidModule, BitsoModule],
  exports: [BelvoModule, PlaidModule, BitsoModule],
})
export class ProvidersModule {}