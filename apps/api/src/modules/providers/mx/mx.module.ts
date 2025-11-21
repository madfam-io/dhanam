import { Module } from '@nestjs/common';

import { CryptoModule } from '../../../core/crypto/crypto.module';
import { PrismaModule } from '../../../core/prisma/prisma.module';

import { MxService } from './mx.service';

@Module({
  imports: [PrismaModule, CryptoModule],
  providers: [MxService],
  exports: [MxService],
})
export class MxModule {}
