import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BelvoService } from './belvo.service';
import { BelvoController } from './belvo.controller';
import { PrismaModule } from '@core/prisma/prisma.module';
import { CryptoModule } from '@core/crypto/crypto.module';
import { AuditModule } from '@core/audit/audit.module';
import { AccountsModule } from '@modules/accounts/accounts.module';
import { TransactionsModule } from '@modules/transactions/transactions.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    CryptoModule,
    AuditModule,
    AccountsModule,
    TransactionsModule,
  ],
  controllers: [BelvoController],
  providers: [BelvoService],
  exports: [BelvoService],
})
export class BelvoModule {}