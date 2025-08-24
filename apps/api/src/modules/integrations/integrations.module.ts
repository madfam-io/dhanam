import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { BelvoModule } from '../providers/belvo/belvo.module';
import { PlaidModule } from '../providers/plaid/plaid.module';
import { BitsoModule } from '../providers/bitso/bitso.module';

@Module({
  imports: [BelvoModule, PlaidModule, BitsoModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}