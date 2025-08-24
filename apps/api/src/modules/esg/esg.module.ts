import { Module } from '@nestjs/common';
import { EsgController } from './esg.controller';
import { EsgService } from './esg.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EsgController],
  providers: [EsgService],
  exports: [EsgService],
})
export class EsgModule {}