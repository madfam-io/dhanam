import { Module } from '@nestjs/common';
import { PlaidController } from './plaid.controller';
import { PlaidService } from './plaid.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { CryptoModule } from '../../../core/crypto/crypto.module';
import { SpacesModule } from '../../spaces/spaces.module';

@Module({
  imports: [PrismaModule, CryptoModule, SpacesModule],
  controllers: [PlaidController],
  providers: [PlaidService],
  exports: [PlaidService],
})
export class PlaidModule {}