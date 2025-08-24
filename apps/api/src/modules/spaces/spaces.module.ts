import { Module } from '@nestjs/common';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';
import { SpaceGuard } from './guards/space.guard';
import { PrismaModule } from '@core/prisma/prisma.module';
import { LoggerModule } from '@core/logger/logger.module';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [SpacesController],
  providers: [SpacesService, SpaceGuard],
  exports: [SpacesService, SpaceGuard],
})
export class SpacesModule {}