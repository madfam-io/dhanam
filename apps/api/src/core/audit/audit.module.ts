import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaModule } from '@core/prisma/prisma.module';
import { LoggerModule } from '@core/logger/logger.module';

@Module({
  imports: [PrismaModule, LoggerModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}