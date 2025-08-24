import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { PrismaModule } from '@core/prisma/prisma.module';
import { CategoriesModule } from '@modules/categories/categories.module';
import { SpacesModule } from '@modules/spaces/spaces.module';
import { BitsoModule } from '@modules/providers/bitso/bitso.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    CategoriesModule,
    SpacesModule,
    BitsoModule,
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}