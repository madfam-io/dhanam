import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    // Generate unique request ID if not provided
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    
    // Add to request headers
    req.headers['x-request-id'] = requestId;
    
    // Add to response headers
    res.header('x-request-id', requestId);
    
    next();
  }
}