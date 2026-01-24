import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RedisModule } from '../../../core/redis/redis.module';

import { ZillowService } from './zillow.service';

@Module({
  imports: [ConfigModule, RedisModule],
  providers: [ZillowService],
  exports: [ZillowService],
})
export class ZillowModule {}
