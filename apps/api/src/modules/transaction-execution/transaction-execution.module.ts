import { Module } from '@nestjs/common';

import { AuditModule } from '../../core/audit/audit.module';
import { CryptoModule } from '../../core/crypto/crypto.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { SpacesModule } from '../spaces/spaces.module';

// Provider adapters
import { BelvoExecutionProvider } from './providers/belvo-execution.provider';
import { BitsoExecutionProvider } from './providers/bitso-execution.provider';
import { PlaidExecutionProvider } from './providers/plaid-execution.provider';
import { ProviderFactoryService } from './providers/provider-factory.service';

// Phase 3 services
import { OrderSchedulingService } from './services/order-scheduling.service';
import { PriceMonitoringService } from './services/price-monitoring.service';
import { TransactionExecutionController } from './transaction-execution.controller';
import { TransactionExecutionService } from './transaction-execution.service';

@Module({
  imports: [PrismaModule, AuditModule, SpacesModule, BillingModule, CryptoModule],
  controllers: [TransactionExecutionController],
  providers: [
    TransactionExecutionService,
    BitsoExecutionProvider,
    PlaidExecutionProvider,
    BelvoExecutionProvider,
    ProviderFactoryService,
    PriceMonitoringService,
    OrderSchedulingService,
  ],
  exports: [
    TransactionExecutionService,
    ProviderFactoryService,
    PriceMonitoringService,
    OrderSchedulingService,
  ],
})
export class TransactionExecutionModule {}
