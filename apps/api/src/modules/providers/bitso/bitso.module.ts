import { Module } from '@nestjs/common';
import { BitsoController } from './bitso.controller';
import { BitsoService } from './bitso.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { CryptoModule } from '../../../core/crypto/crypto.module';

@Module({
  imports: [PrismaModule, CryptoModule],
  controllers: [BitsoController],
  providers: [BitsoService],
  exports: [BitsoService],
})
export class BitsoModule {}