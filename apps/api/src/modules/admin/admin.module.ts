import { Module } from '@nestjs/common';

import { AuditModule } from '@core/audit/audit.module';
import { LoggerModule } from '@core/logger/logger.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { RedisModule } from '@core/redis/redis.module';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [PrismaModule, LoggerModule, RedisModule, AuditModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {}
