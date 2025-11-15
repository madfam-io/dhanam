import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    // Build database URL with connection pool configuration
    const databaseUrl = configService.get('database.url') || configService.get('DATABASE_URL');
    const poolSize = configService.get('DATABASE_POOL_SIZE')
      ? parseInt(configService.get('DATABASE_POOL_SIZE')!, 10)
      : 10; // Default Prisma pool size

    // Append connection pool parameters to DATABASE_URL if not already present
    let finalUrl = databaseUrl;
    if (databaseUrl && !databaseUrl.includes('connection_limit')) {
      const separator = databaseUrl.includes('?') ? '&' : '?';
      finalUrl = `${databaseUrl}${separator}connection_limit=${poolSize}&pool_timeout=10`;
    }

    super({
      datasources: {
        db: {
          url: finalUrl,
        },
      },
      log:
        configService.get('NODE_ENV') === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (this.configService.get('NODE_ENV') !== 'test') {
      throw new Error('cleanDatabase is only allowed in test environment');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => typeof key === 'string' && key[0] !== '_' && key[0] !== '$'
    ) as string[];

    return Promise.all(models.map((model) => (this as any)[model].deleteMany()));
  }
}
