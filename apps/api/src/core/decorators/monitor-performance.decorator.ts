import { Logger } from '@nestjs/common';

export function MonitorPerformance(threshold = 1000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const logger = new Logger(target.constructor.name);

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const className = target.constructor.name;
      const methodName = propertyName;

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;

        if (duration > threshold) {
          logger.warn(
            `Slow operation detected: ${className}.${methodName} took ${duration}ms (threshold: ${threshold}ms)`,
            {
              className,
              methodName,
              duration,
              threshold,
              args: args.length,
            }
          );
        } else {
          logger.debug(`${className}.${methodName} completed in ${duration}ms`, {
            className,
            methodName,
            duration,
          });
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`Method failed: ${className}.${methodName} after ${duration}ms`, {
          className,
          methodName,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    };

    return descriptor;
  };
}
