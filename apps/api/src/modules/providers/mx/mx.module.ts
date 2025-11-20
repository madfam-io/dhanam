import { Module } from '@nestjs/common';

import { PrismaModule } from '../../../core/prisma/prisma.module';

import { MxService } from './mx.service';

@Module({
  imports: [PrismaModule],
  providers: [MxService],
  exports: [MxService],
})
export class MxModule {}
