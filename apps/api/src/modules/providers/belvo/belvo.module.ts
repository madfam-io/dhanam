import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuditModule } from '@core/audit/audit.module';
import { CryptoModule } from '@core/crypto/crypto.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { AccountsModule } from '@modules/accounts/accounts.module';
import { OrchestratorModule } from '@modules/providers/orchestrator/orchestrator.module';
import { TransactionsModule } from '@modules/transactions/transactions.module';

import { BelvoController } from './belvo.controller';
import { BelvoService } from './belvo.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    CryptoModule,
    AuditModule,
    AccountsModule,
    TransactionsModule,
    OrchestratorModule,
  ],
  controllers: [BelvoController],
  providers: [BelvoService],
  exports: [BelvoService],
})
export class BelvoModule {}
