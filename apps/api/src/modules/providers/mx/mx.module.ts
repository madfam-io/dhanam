import { Module } from '@nestjs/common';

import { PrismaModule } from '../../../core/prisma/prisma.module';
import { CryptoModule } from '../../../core/crypto/crypto.module';

import { MxService } from './mx.service';

@Module({
  imports: [PrismaModule, CryptoModule],
  providers: [MxService],
  exports: [MxService],
})
export class MxModule {}
