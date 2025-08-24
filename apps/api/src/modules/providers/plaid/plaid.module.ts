import { Module } from '@nestjs/common';

import { CryptoModule } from '../../../core/crypto/crypto.module';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { SpacesModule } from '../../spaces/spaces.module';

import { PlaidController } from './plaid.controller';
import { PlaidService } from './plaid.service';

@Module({
  imports: [PrismaModule, CryptoModule, SpacesModule],
  controllers: [PlaidController],
  providers: [PlaidService],
  exports: [PlaidService],
})
export class PlaidModule {}
