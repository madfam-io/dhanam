import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RedisModule } from '../../core/redis/redis.module';

import { AxieAdapter } from './adapters/axie.adapter';
import { EnjinAdapter } from './adapters/enjin.adapter';
import { GalaAdapter } from './adapters/gala.adapter';
import { IlluviumAdapter } from './adapters/illuvium.adapter';
import { ImmutableAdapter } from './adapters/immutable.adapter';
import { SandboxAdapter } from './adapters/sandbox.adapter';
import { StarAtlasAdapter } from './adapters/star-atlas.adapter';
import { GamingController } from './gaming.controller';
import { GamingService } from './gaming.service';
import { SandboxService } from './sandbox.service';

@Module({
  imports: [ConfigModule, RedisModule],
  controllers: [GamingController],
  providers: [
    GamingService,
    SandboxService,
    SandboxAdapter,
    AxieAdapter,
    IlluviumAdapter,
    StarAtlasAdapter,
    GalaAdapter,
    EnjinAdapter,
    ImmutableAdapter,
  ],
  exports: [GamingService, SandboxService],
})
export class GamingModule {}
