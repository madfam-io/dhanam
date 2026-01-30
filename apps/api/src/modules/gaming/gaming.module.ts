import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RedisModule } from '../../core/redis/redis.module';

import { GamingController } from './gaming.controller';
import { SandboxService } from './sandbox.service';

@Module({
  imports: [ConfigModule, RedisModule],
  controllers: [GamingController],
  providers: [SandboxService],
  exports: [SandboxService],
})
export class GamingModule {}
