import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../../../core/prisma/prisma.module';
import { RedisModule } from '../../../core/redis/redis.module';
import { BillingModule } from '../../billing/billing.module';
import { SpacesModule } from '../../spaces/spaces.module';

import { DeFiController } from './defi.controller';
import { DeFiService } from './defi.service';
import { ZapperService } from './zapper.service';

@Module({
  imports: [ConfigModule, RedisModule, PrismaModule, SpacesModule, BillingModule],
  controllers: [DeFiController],
  providers: [ZapperService, DeFiService],
  exports: [ZapperService, DeFiService],
})
export class DeFiModule {}
