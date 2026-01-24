import { Module } from '@nestjs/common';

import { PrismaModule } from '../../../core/prisma/prisma.module';
import { SpacesModule } from '../../spaces/spaces.module';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';

import { ConnectionHealthController } from './connection-health.controller';
import { ConnectionHealthService } from './connection-health.service';

@Module({
  imports: [PrismaModule, OrchestratorModule, SpacesModule],
  controllers: [ConnectionHealthController],
  providers: [ConnectionHealthService],
  exports: [ConnectionHealthService],
})
export class ConnectionHealthModule {}
