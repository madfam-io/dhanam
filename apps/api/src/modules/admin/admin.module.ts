import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { PrismaModule } from '@core/prisma/prisma.module';
import { LoggerModule } from '@core/logger/logger.module';
import { RedisModule } from '@core/redis/redis.module';
import { AuditModule } from '@core/audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    RedisModule,
    AuditModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {}