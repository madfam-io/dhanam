import { Module } from '@nestjs/common';
import { PlaidController } from './plaid.controller';
import { PlaidService } from './plaid.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { CryptoModule } from '../../../core/crypto/crypto.module';

@Module({
  imports: [PrismaModule, CryptoModule],
  controllers: [PlaidController],
  providers: [PlaidService],
  exports: [PlaidService],
})
export class PlaidModule {}