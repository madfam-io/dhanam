import { Module } from '@nestjs/common';

import { AuditModule } from '@core/audit/audit.module';
import { CoreModule } from '@core/core.module';
import { SpacesModule } from '@modules/spaces/spaces.module';

import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';

@Module({
  imports: [CoreModule, AuditModule, SpacesModule],
  providers: [BlockchainService],
  controllers: [BlockchainController],
  exports: [BlockchainService],
})
export class BlockchainModule {}
