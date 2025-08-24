import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { CoreModule } from '@core/core.module';
import { AuditModule } from '@core/audit/audit.module';

@Module({
  imports: [CoreModule, AuditModule],
  providers: [BlockchainService],
  controllers: [BlockchainController],
  exports: [BlockchainService],
})
export class BlockchainModule {}