import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SpacesModule } from '../spaces/spaces.module';

import { SubscriptionDetectorService } from './subscription-detector.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [PrismaModule, SpacesModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionDetectorService],
  exports: [SubscriptionsService, SubscriptionDetectorService],
})
export class SubscriptionsModule {}
