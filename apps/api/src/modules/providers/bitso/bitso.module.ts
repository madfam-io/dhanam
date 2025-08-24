import { Module } from '@nestjs/common';
import { BitsoController } from './bitso.controller';
import { BitsoService } from './bitso.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { CryptoModule } from '../../../core/crypto/crypto.module';
import { SpacesModule } from '../../spaces/spaces.module';

@Module({
  imports: [PrismaModule, CryptoModule, SpacesModule],
  controllers: [BitsoController],
  providers: [BitsoService],
  exports: [BitsoService],
})
export class BitsoModule {}