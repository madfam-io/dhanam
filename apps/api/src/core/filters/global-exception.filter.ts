import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    path: string;
    method: string;
    requestId?: string;
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const errorResponse = this.createErrorResponse(exception, request);
    
    // Log error with context
    this.logError(exception, request, errorResponse);

    response.status(errorResponse.meta.status || 500).send(errorResponse);
  }

  private createErrorResponse(exception: unknown, request: FastifyRequest): ErrorResponse & { meta: { status: number; timestamp: string; path: string; method: string; requestId?: string } } {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      
      if (typeof response === 'string') {
        message = response;
        code = this.getCodeFromStatus(status);
      } else if (typeof response === 'object' && response !== null) {
        const responseObj = response as any;
        message = responseObj.message || message;
        code = responseObj.code || this.getCodeFromStatus(status);
        details = responseObj.details;
      }
    } else if (exception instanceof PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'DATABASE_ERROR';
      message = this.mapPrismaError(exception);
      details = {
        prismaCode: exception.code,
        target: exception.meta?.target,
      };
    } else if (exception instanceof Error) {
      message = exception.message;
      code = 'APPLICATION_ERROR';
    }

    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        requestId: request.headers['x-request-id'] as string,
      },
    };
  }

  private logError(exception: unknown, request: FastifyRequest, errorResponse: ErrorResponse & { meta: { status: number } }) {
    const { status } = errorResponse.meta;
    const logData = {
      url: request.url,
      method: request.method,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      userId: (request as any).user?.id,
      errorCode: errorResponse.error.code,
      statusCode: status,
    };

    if (status >= 500) {
      this.logger.error(
        `${errorResponse.error.code}: ${errorResponse.error.message}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
        JSON.stringify(logData)
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${errorResponse.error.code}: ${errorResponse.error.message}`,
        JSON.stringify(logData)
      );
    }
  }

  private getCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_SERVER_ERROR';
      case HttpStatus.BAD_GATEWAY:
        return 'BAD_GATEWAY';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      case HttpStatus.GATEWAY_TIMEOUT:
        return 'GATEWAY_TIMEOUT';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  private mapPrismaError(error: PrismaClientKnownRequestError): string {
    switch (error.code) {
      case 'P2002':
        return `Duplicate entry: ${error.meta?.target || 'unique constraint violated'}`;
      case 'P2014':
        return 'The change you are trying to make would violate a relation constraint';
      case 'P2003':
        return 'Foreign key constraint failed';
      case 'P2025':
        return 'Record not found';
      case 'P2016':
        return 'Query interpretation error';
      case 'P2017':
        return 'Records for relation not connected';
      case 'P2021':
        return 'Table does not exist in database';
      case 'P2022':
        return 'Column does not exist in database';
      default:
        return `Database error: ${error.message}`;
    }
  }
}