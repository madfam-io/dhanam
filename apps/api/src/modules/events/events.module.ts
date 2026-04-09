import { Module } from '@nestjs/common';

import { RedisModule } from '../../core/redis/redis.module';

import { EventPublisherService } from './event-publisher.service';

@Module({
  imports: [RedisModule],
  providers: [EventPublisherService],
  exports: [EventPublisherService],
})
export class EventsModule {}
