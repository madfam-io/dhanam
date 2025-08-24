import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';

import { EnhancedEsgService } from './enhanced-esg.service';
import { EsgController } from './esg.controller';
import { EsgService } from './esg.service';

@Module({
  imports: [PrismaModule],
  controllers: [EsgController],
  providers: [EsgService, EnhancedEsgService],
  exports: [EsgService, EnhancedEsgService],
})
export class EsgModule {}
