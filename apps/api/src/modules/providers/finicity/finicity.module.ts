import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { PrismaModule } from '../../../core/prisma/prisma.module';
import { CryptoModule } from '../../../core/crypto/crypto.module';

import { FinicityService } from './finicity.service';

@Module({
  imports: [PrismaModule, CryptoModule, HttpModule],
  providers: [FinicityService],
  exports: [FinicityService],
})
export class FinicityModule {}
