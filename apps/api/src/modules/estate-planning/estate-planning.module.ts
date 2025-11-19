import { Module } from '@nestjs/common';
import { EstatePlanningController } from './estate-planning.controller';
import { EstatePlanningService } from './estate-planning.service';
import { PrismaModule } from '../../core/database/prisma.module';
import { AuditModule } from '../../core/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [EstatePlanningController],
  providers: [EstatePlanningService],
  exports: [EstatePlanningService],
})
export class EstatePlanningModule {}
