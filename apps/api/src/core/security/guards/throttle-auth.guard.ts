import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

// Strict rate limiting for authentication endpoints
@Injectable()
export class ThrottleAuthGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Track by IP address for auth endpoints
    return req.ip || 'unknown';
  }
}

@Injectable() 
export class StrictThrottleGuard extends ThrottlerGuard {
  // For sensitive endpoints like password reset, TOTP setup
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Combine IP and user agent for more restrictive tracking
    const ip = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}-${userAgent}`;
  }
}