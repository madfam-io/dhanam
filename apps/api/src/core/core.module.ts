import { Module } from '@nestjs/common';

import { CryptoModule } from './crypto/crypto.module';
import { LoggerModule } from './logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule, CryptoModule, LoggerModule],
  exports: [PrismaModule, RedisModule, CryptoModule, LoggerModule],
})
export class CoreModule {}
