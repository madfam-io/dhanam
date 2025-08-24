import { Module } from '@nestjs/common';

import { CryptoModule } from '../../../core/crypto/crypto.module';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { SpacesModule } from '../../spaces/spaces.module';

import { BitsoController } from './bitso.controller';
import { BitsoService } from './bitso.service';

@Module({
  imports: [PrismaModule, CryptoModule, SpacesModule],
  controllers: [BitsoController],
  providers: [BitsoService],
  exports: [BitsoService],
})
export class BitsoModule {}
