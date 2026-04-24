import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';

import { EventDispatcherService } from './services/event-dispatcher.service';
import { SvixClient } from './services/svix.client';
import { WebhookEndpointsController } from './webhook-endpoints.controller';

@Module({
  imports: [PrismaModule],
  controllers: [WebhookEndpointsController],
  providers: [SvixClient, EventDispatcherService],
  exports: [EventDispatcherService, SvixClient],
})
export class WebhookOutboundModule {}
