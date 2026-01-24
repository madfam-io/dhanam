import { Injectable } from '@nestjs/common';

import { Provider } from '@db';

export interface UserFriendlyError {
  title: string;
  message: string;
  actionRequired: string;
  actionButton: string;
  actionUrl?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  estimatedResolutionTime?: string;
  supportArticleUrl?: string;
}

/**
 * Maps provider error codes and messages to user-friendly explanations
 * with actionable steps for resolution
 */
@Injectable()
export class ErrorMessagesService {
  /**
   * Get user-friendly error message based on error code/message and provider
   */
  getErrorMessage(
    provider: Provider,
    errorCode: string | null,
    errorMessage: string | null
  ): UserFriendlyError {
    // Normalize error for matching
    const normalizedError = (errorCode || errorMessage || '').toLowerCase();

    // Check for common error patterns
    if (this.isRateLimitError(normalizedError)) {
      return this.getRateLimitError(provider);
    }

    if (this.isAuthError(normalizedError)) {
      return this.getAuthError(provider);
    }

    if (this.isConnectionError(normalizedError)) {
      return this.getConnectionError(provider);
    }

    if (this.isTimeoutError(normalizedError)) {
      return this.getTimeoutError(provider);
    }

    if (this.isMaintenanceError(normalizedError)) {
      return this.getMaintenanceError(provider);
    }

    if (this.isInstitutionError(normalizedError)) {
      return this.getInstitutionError(provider);
    }

    // Default error message
    return this.getDefaultError(provider, errorMessage);
  }

  private isRateLimitError(error: string): boolean {
    const patterns = [
      'rate limit',
      'too many requests',
      'throttl',
      '429',
      'request limit',
      'exceeded limit',
    ];
    return patterns.some((p) => error.includes(p));
  }

  private isAuthError(error: string): boolean {
    const patterns = [
      'unauthorized',
      'invalid_token',
      'expired',
      'invalid credentials',
      'authentication',
      'login required',
      'session expired',
      'revoked',
      'access denied',
      '401',
      '403',
    ];
    return patterns.some((p) => error.includes(p));
  }

  private isConnectionError(error: string): boolean {
    const patterns = [
      'connection refused',
      'econnrefused',
      'network error',
      'dns',
      'host not found',
      'socket',
      'enotfound',
    ];
    return patterns.some((p) => error.includes(p));
  }

  private isTimeoutError(error: string): boolean {
    const patterns = ['timeout', 'timed out', 'etimedout', 'deadline exceeded'];
    return patterns.some((p) => error.includes(p));
  }

  private isMaintenanceError(error: string): boolean {
    const patterns = ['maintenance', '503', 'service unavailable', 'temporarily unavailable'];
    return patterns.some((p) => error.includes(p));
  }

  private isInstitutionError(error: string): boolean {
    const patterns = [
      'institution',
      'bank error',
      'upstream error',
      'provider error',
      'item error',
    ];
    return patterns.some((p) => error.includes(p));
  }

  private getRateLimitError(provider: Provider): UserFriendlyError {
    const providerName = this.getProviderDisplayName(provider);
    return {
      title: 'Sync Temporarily Paused',
      message: `We've made too many requests to ${providerName} in a short time. This is normal and will resolve automatically.`,
      actionRequired: 'Wait a few minutes before trying again.',
      actionButton: 'Retry Sync',
      severity: 'warning',
      estimatedResolutionTime: '5-15 minutes',
    };
  }

  private getAuthError(provider: Provider): UserFriendlyError {
    const providerName = this.getProviderDisplayName(provider);
    return {
      title: 'Reconnection Required',
      message: `Your connection to ${providerName} needs to be refreshed. This happens periodically for security.`,
      actionRequired:
        'Please reconnect your account to continue syncing. Your transaction history will be preserved.',
      actionButton: 'Reconnect Account',
      actionUrl: '/accounts/reconnect',
      severity: 'error',
      estimatedResolutionTime: '2-5 minutes',
    };
  }

  private getConnectionError(provider: Provider): UserFriendlyError {
    const providerName = this.getProviderDisplayName(provider);
    return {
      title: 'Connection Issue',
      message: `We're having trouble reaching ${providerName}. This is usually a temporary network issue.`,
      actionRequired: 'Check your internet connection and try again in a few minutes.',
      actionButton: 'Retry',
      severity: 'warning',
      estimatedResolutionTime: '5-30 minutes',
    };
  }

  private getTimeoutError(provider: Provider): UserFriendlyError {
    const providerName = this.getProviderDisplayName(provider);
    return {
      title: 'Sync Taking Longer Than Expected',
      message: `${providerName} is taking longer than usual to respond. Your data is safe.`,
      actionRequired: "We'll automatically retry. You can also try again manually.",
      actionButton: 'Retry Sync',
      severity: 'info',
      estimatedResolutionTime: '10-30 minutes',
    };
  }

  private getMaintenanceError(provider: Provider): UserFriendlyError {
    const providerName = this.getProviderDisplayName(provider);
    return {
      title: 'Scheduled Maintenance',
      message: `${providerName} is undergoing maintenance. Syncing will resume automatically when complete.`,
      actionRequired: "No action needed. We'll sync your data when the service is back.",
      actionButton: 'Check Status',
      severity: 'info',
      estimatedResolutionTime: '1-4 hours',
    };
  }

  private getInstitutionError(_provider: Provider): UserFriendlyError {
    return {
      title: 'Bank Connection Issue',
      message:
        'Your bank or institution is experiencing technical difficulties. This is on their end, not yours.',
      actionRequired:
        'Wait for the institution to resolve the issue. You can try reconnecting if the problem persists.',
      actionButton: 'View Status',
      severity: 'warning',
      estimatedResolutionTime: '1-24 hours',
    };
  }

  private getDefaultError(provider: Provider, originalMessage: string | null): UserFriendlyError {
    const providerName = this.getProviderDisplayName(provider);
    return {
      title: 'Sync Issue',
      message: `We encountered an issue syncing with ${providerName}. ${originalMessage ? `Details: ${originalMessage}` : ''}`,
      actionRequired: 'Try refreshing the connection. If the issue persists, contact support.',
      actionButton: 'Retry',
      severity: 'error',
    };
  }

  private getProviderDisplayName(provider: Provider): string {
    const names: Record<Provider, string> = {
      belvo: 'Belvo (Mexico)',
      plaid: 'Plaid (US)',
      mx: 'MX',
      finicity: 'Finicity',
      bitso: 'Bitso',
      blockchain: 'Blockchain',
      manual: 'Manual',
    };
    return names[provider] || provider;
  }

  /**
   * Get a summary message for multiple errors
   */
  getSummaryMessage(
    errorCount: number,
    requiresReauthCount: number,
    degradedCount: number
  ): string {
    const parts: string[] = [];

    if (requiresReauthCount > 0) {
      parts.push(
        `${requiresReauthCount} account${requiresReauthCount > 1 ? 's' : ''} need${requiresReauthCount === 1 ? 's' : ''} reconnection`
      );
    }

    if (errorCount > 0) {
      parts.push(`${errorCount} account${errorCount > 1 ? 's have' : ' has'} sync errors`);
    }

    if (degradedCount > 0) {
      parts.push(
        `${degradedCount} account${degradedCount > 1 ? 's are' : ' is'} experiencing delays`
      );
    }

    if (parts.length === 0) {
      return 'All accounts are syncing normally.';
    }

    return parts.join(', ') + '.';
  }
}
