import { Module } from '@nestjs/common';
import { TransactionExecutionController } from './transaction-execution.controller';
import { TransactionExecutionService } from './transaction-execution.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuditModule } from '../../core/audit/audit.module';
import { SpacesModule } from '../spaces/spaces.module';
import { BillingModule } from '../billing/billing.module';
import { CryptoModule } from '../../core/crypto/crypto.module';

// Provider adapters
import { BitsoExecutionProvider } from './providers/bitso-execution.provider';
import { PlaidExecutionProvider } from './providers/plaid-execution.provider';
import { BelvoExecutionProvider } from './providers/belvo-execution.provider';
import { ProviderFactoryService } from './providers/provider-factory.service';

@Module({
  imports: [PrismaModule, AuditModule, SpacesModule, BillingModule, CryptoModule],
  controllers: [TransactionExecutionController],
  providers: [
    TransactionExecutionService,
    BitsoExecutionProvider,
    PlaidExecutionProvider,
    BelvoExecutionProvider,
    ProviderFactoryService,
  ],
  exports: [TransactionExecutionService, ProviderFactoryService],
})
export class TransactionExecutionModule {}
