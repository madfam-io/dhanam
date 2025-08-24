import { Module } from '@nestjs/common';
import { EsgController } from './esg.controller';
import { EsgService } from './esg.service';
import { EnhancedEsgService } from './enhanced-esg.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EsgController],
  providers: [EsgService, EnhancedEsgService],
  exports: [EsgService, EnhancedEsgService],
})
export class EsgModule {}