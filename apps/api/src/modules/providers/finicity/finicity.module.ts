import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { CryptoModule } from '../../../core/crypto/crypto.module';
import { PrismaModule } from '../../../core/prisma/prisma.module';

import { FinicityService } from './finicity.service';

@Module({
  imports: [PrismaModule, CryptoModule, HttpModule],
  providers: [FinicityService],
  exports: [FinicityService],
})
export class FinicityModule {}
