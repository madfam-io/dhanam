import { Module } from '@nestjs/common';

import { LoggerModule } from '@core/logger/logger.module';
import { PrismaModule } from '@core/prisma/prisma.module';

import { AuditService } from './audit.service';

@Module({
  imports: [PrismaModule, LoggerModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
