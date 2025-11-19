import { Module } from '@nestjs/common';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { PrismaModule } from '../../core/database/prisma.module';
import { AuditModule } from '../../core/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
