import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { RedisModule } from '@core/redis/redis.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      // General API rate limiting
      {
        name: 'short',
        ttl: 60 * 1000, // 1 minute
        limit: 60, // 60 requests per minute
      },
      {
        name: 'medium',
        ttl: 15 * 60 * 1000, // 15 minutes
        limit: 300, // 300 requests per 15 minutes
      },
      {
        name: 'long',
        ttl: 60 * 60 * 1000, // 1 hour
        limit: 1000, // 1000 requests per hour
      },
    ]),
    RedisModule,
  ],
  exports: [ThrottlerModule],
})
export class RateLimitingModule {}
