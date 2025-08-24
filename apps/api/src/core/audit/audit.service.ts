import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { LoggerService } from '@core/logger/logger.service';

export interface AuditEventData {
  action: string;
  resource?: string;
  resourceId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class AuditService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async logEvent(data: AuditEventData): Promise<void> {
    try {
      // Log to database for persistent audit trail
      await this.prisma.auditLog.create({
        data: {
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          userId: data.userId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          severity: data.severity || 'low',
          timestamp: new Date(),
        },
      });

      // Also log critical events to application logger
      if (data.severity === 'critical' || data.severity === 'high') {
        this.logger.warn(
          `Security event: ${data.action} - ${data.resource || 'unknown'} by ${data.userId || 'anonymous'}`,
          'AuditService',
        );
      }
    } catch (error) {
      this.logger.error('Failed to log audit event', error as Error, 'AuditService');
    }
  }

  // Convenience methods for common security events
  async logAuthSuccess(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      action: 'AUTH_SUCCESS',
      resource: 'auth',
      userId,
      ipAddress,
      userAgent,
      severity: 'low',
    });
  }

  async logAuthFailure(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      action: 'AUTH_FAILURE',
      resource: 'auth',
      ipAddress,
      userAgent,
      metadata: { attemptedEmail: email },
      severity: 'medium',
    });
  }

  async logPasswordReset(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      action: 'PASSWORD_RESET',
      resource: 'user',
      resourceId: userId,
      userId,
      ipAddress,
      userAgent,
      severity: 'high',
    });
  }

  async logTotpEnabled(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      action: 'TOTP_ENABLED',
      resource: 'user',
      resourceId: userId,
      userId,
      ipAddress,
      userAgent,
      severity: 'medium',
    });
  }

  async logTotpDisabled(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      action: 'TOTP_DISABLED',
      resource: 'user',
      resourceId: userId,
      userId,
      ipAddress,
      userAgent,
      severity: 'high',
    });
  }

  async logSuspiciousActivity(
    action: string,
    userId?: string,
    ipAddress?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      action,
      resource: 'security',
      userId,
      ipAddress,
      metadata,
      severity: 'critical',
    });
  }

  async logDataAccess(
    resource: string,
    resourceId: string,
    userId: string,
    action: 'READ' | 'WRITE' | 'DELETE',
  ): Promise<void> {
    await this.logEvent({
      action: `DATA_${action}`,
      resource,
      resourceId,
      userId,
      severity: action === 'DELETE' ? 'high' : 'low',
    });
  }

  async logProviderConnection(
    provider: string,
    userId: string,
    spaceId: string,
    success: boolean,
    ipAddress?: string,
  ): Promise<void> {
    await this.logEvent({
      action: success ? 'PROVIDER_CONNECTED' : 'PROVIDER_CONNECTION_FAILED',
      resource: 'provider',
      resourceId: spaceId,
      userId,
      ipAddress,
      metadata: { provider },
      severity: success ? 'medium' : 'high',
    });
  }
}