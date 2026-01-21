// eslint-disable-next-line import/no-named-as-default
import fastifyCompress from '@fastify/compress';
// eslint-disable-next-line import/no-named-as-default
import fastifyCors from '@fastify/cors';
// eslint-disable-next-line import/no-named-as-default
import fastifyHelmet from '@fastify/helmet';
// eslint-disable-next-line import/no-named-as-default
import fastifyRateLimit from '@fastify/rate-limit';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { GlobalExceptionFilter } from '@core/filters/global-exception.filter';
import { LoggingInterceptor } from '@core/interceptors/logging.interceptor';
import { RequestIdMiddleware } from '@core/middleware/request-id.middleware';
import { HealthService } from '@core/monitoring/health.service';
import { SentryService } from '@core/monitoring/sentry.service';
import { QueueService } from '@modules/jobs/queue.service';

import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  // Setup global error handlers for unhandled rejections and exceptions
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(fastifyHelmet as any, {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(fastifyCors as any, {
    origin: corsOrigins
      ? corsOrigins.split(',')
      : ['http://localhost:3000', 'http://localhost:19006'],
    credentials: true,
  });

  // Compression
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(fastifyCompress as any, { encodings: ['gzip', 'deflate'] });

  // Rate limiting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(fastifyRateLimit as any, {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    max: configService.get('RATE_LIMIT_MAX') ? parseInt(configService.get('RATE_LIMIT_MAX')!) : 100,
    timeWindow: (configService.get('RATE_LIMIT_WINDOW') as string) || '15 minutes',
    allowList: (req) => {
      // Exclude health probes and metrics from rate limiting
      const path = req.url?.split('?')[0] || '';
      return [
        '/v1/monitoring/health',
        '/v1/monitoring/ready',
        '/metrics',
        '/health',
        '/ready',
      ].includes(path);
    },
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

  // Enable shutdown hooks for graceful termination
  app.enableShutdownHooks();

  // Setup graceful shutdown handler
  const healthService = app.get(HealthService);
  const queueService = app.get(QueueService);
  const sentryService = app.get(SentryService);

  const gracefulShutdown = async (signal: string) => {
    logger.log(`Received ${signal}, starting graceful shutdown...`);

    // Mark service as shutting down (health probes will return not ready)
    healthService.setShuttingDown(true);
    logger.log('Health service marked as shutting down');

    // Wait a brief moment for load balancer to stop sending traffic
    await new Promise((resolve) => setTimeout(resolve, 5000));
    logger.log('Grace period complete, draining queues...');

    // Drain queues with timeout
    try {
      await queueService.drainQueues(30000); // 30 second timeout
      logger.log('Queue drain complete');
    } catch (error) {
      logger.warn('Queue drain timed out or failed:', error);
    }

    // Flush Sentry events
    try {
      await sentryService.flush(2000);
      logger.log('Sentry events flushed');
    } catch (error) {
      logger.warn('Sentry flush failed:', error);
    }

    // Close the application
    logger.log('Closing application...');
    await app.close();
    logger.log('Application closed, exiting');
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  const port = configService.get('PORT') || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application started on port ${port}`);
}

bootstrap();
