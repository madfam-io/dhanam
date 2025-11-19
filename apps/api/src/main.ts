// eslint-disable-next-line import/no-named-as-default
import fastifyCompress from '@fastify/compress';
// eslint-disable-next-line import/no-named-as-default
import fastifyCors from '@fastify/cors';
// eslint-disable-next-line import/no-named-as-default
import fastifyHelmet from '@fastify/helmet';
// eslint-disable-next-line import/no-named-as-default
import fastifyRateLimit from '@fastify/rate-limit';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { GlobalExceptionFilter } from '@core/filters/global-exception.filter';
import { LoggingInterceptor } from '@core/interceptors/logging.interceptor';
import { RequestIdMiddleware } from '@core/middleware/request-id.middleware';

import { AppModule } from './app.module';

async function bootstrap() {
  // Setup global error handlers for unhandled rejections and exceptions
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // In production, you might want to log to an error tracking service (e.g., Sentry)
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Gracefully shut down the application
    process.exit(1);
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
    })
  );

  const configService = app.get(ConfigService);

  // Global prefix and versioning
  app.setGlobalPrefix('v1');
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Security headers
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // CORS configuration
  const corsOrigins = configService.get('CORS_ORIGINS');
  await app.register(fastifyCors, {
    origin: corsOrigins
      ? corsOrigins.split(',')
      : ['http://localhost:3000', 'http://localhost:19006'],
    credentials: true,
  });

  // Compression
  await app.register(fastifyCompress, { encodings: ['gzip', 'deflate'] });

  // Rate limiting
  await app.register(fastifyRateLimit, {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    max: configService.get('RATE_LIMIT_MAX') ? parseInt(configService.get('RATE_LIMIT_MAX')!) : 100,
    timeWindow: (configService.get('RATE_LIMIT_WINDOW') as string) || '15 minutes',
  });

  // Global middleware and filters
  app.use(new RequestIdMiddleware().use);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Swagger
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Dhanam Ledger API')
      .setDescription('Comprehensive financial management API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = configService.get('PORT') || 4000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
