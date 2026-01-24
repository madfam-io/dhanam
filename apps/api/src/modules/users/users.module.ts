import { Module } from '@nestjs/common';

import { PrismaModule } from '@core/prisma/prisma.module';

import { ActivityTrackerService } from './activity-tracker.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, ActivityTrackerService],
  exports: [UsersService, ActivityTrackerService],
})
export class UsersModule {}
