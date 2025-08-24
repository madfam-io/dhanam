import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly isDevelopment: boolean;

  constructor(private readonly _configService: ConfigService) {
    this.isDevelopment = this._configService.get('NODE_ENV') === 'development';
  }

  log(message: any, context?: string) {
    if (this.isDevelopment) {
      console.log(`[${context || 'Application'}] ${message}`);
    } else {
      console.log(
        JSON.stringify({
          level: 'info',
          message,
          context,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  error(message: any, trace?: string, context?: string) {
    if (this.isDevelopment) {
      console.error(`[${context || 'Application'}] ${message}`, trace);
    } else {
      console.error(
        JSON.stringify({
          level: 'error',
          message,
          trace,
          context,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  warn(message: any, context?: string) {
    if (this.isDevelopment) {
      console.warn(`[${context || 'Application'}] ${message}`);
    } else {
      console.warn(
        JSON.stringify({
          level: 'warn',
          message,
          context,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  debug(message: any, context?: string) {
    if (this.isDevelopment) {
      console.debug(`[${context || 'Application'}] ${message}`);
    }
  }

  verbose(message: any, context?: string) {
    if (this.isDevelopment) {
      console.log(`[VERBOSE][${context || 'Application'}] ${message}`);
    }
  }
}
