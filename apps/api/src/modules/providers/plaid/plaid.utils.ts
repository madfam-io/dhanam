import { AxiosError } from 'axios';
import { PlaidError } from 'plaid';

import { ProviderException } from '@core/exceptions/domain-exceptions';
import { withTimeout, TIMEOUT_PRESETS } from '@core/utils/timeout.util';
import { AccountType, Currency } from '@db';

import { CircuitBreakerService } from '../orchestrator/circuit-breaker.service';

export const PLAID_TIMEOUT_MS = TIMEOUT_PRESETS.provider_api;
export const PLAID_REGION = 'US';

/**
 * Map Plaid account type to internal AccountType
 */
export function mapPlaidAccountType(plaidType: string): AccountType {
  switch (plaidType.toLowerCase()) {
    case 'depository':
      return AccountType.checking;
    case 'credit':
      return AccountType.credit;
    case 'investment':
      return AccountType.investment;
    default:
      return AccountType.other;
  }
}

/**
 * Map Plaid currency to internal Currency
 */
export function mapPlaidCurrency(currency: string): Currency {
  const upperCurrency = currency?.toUpperCase();
  switch (upperCurrency) {
    case 'MXN':
      return Currency.MXN;
    case 'USD':
      return Currency.USD;
    case 'EUR':
      return Currency.EUR;
    default:
      return Currency.USD; // Default to USD for US-focused Plaid
  }
}

/**
 * Map Plaid errors to domain exceptions
 */
export function mapPlaidError(error: unknown, operation: string): ProviderException {
  if (error instanceof ProviderException) {
    return error;
  }

  // Check for Plaid-specific errors
  const axiosError = error as AxiosError<PlaidError>;
  if (axiosError.response?.data) {
    const plaidError = axiosError.response.data;
    const errorCode = plaidError.error_code;
    const errorMessage = plaidError.error_message || 'Unknown Plaid error';

    // Auth errors
    if (errorCode === 'INVALID_ACCESS_TOKEN' || errorCode === 'ITEM_LOGIN_REQUIRED') {
      return ProviderException.authFailed('plaid', new Error(errorMessage));
    }

    // Rate limiting
    if (errorCode === 'RATE_LIMIT_EXCEEDED') {
      return ProviderException.rateLimited('plaid', 60000);
    }

    // Institution errors
    if (
      errorCode === 'INSTITUTION_DOWN' ||
      errorCode === 'INSTITUTION_NOT_RESPONDING' ||
      errorCode === 'INSTITUTION_NOT_AVAILABLE'
    ) {
      return ProviderException.unavailable('plaid', new Error(errorMessage));
    }

    // Timeout errors
    if (errorCode === 'INTERNAL_SERVER_ERROR' && errorMessage.includes('timeout')) {
      return ProviderException.timeout('plaid', operation);
    }

    return new ProviderException(errorCode, errorMessage, {
      provider: 'plaid',
      operation,
      retryable: ['INTERNAL_SERVER_ERROR', 'INSTITUTION_DOWN'].includes(errorCode),
    });
  }

  // Network errors
  if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
    return ProviderException.timeout('plaid', operation);
  }

  if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ECONNRESET') {
    return ProviderException.unavailable('plaid', error instanceof Error ? error : undefined);
  }

  return ProviderException.syncFailed(
    'plaid',
    operation,
    error instanceof Error ? error : new Error(String(error))
  );
}

/**
 * Create a wrapper function for Plaid API calls with circuit breaker, timeout, and error handling
 */
export function createPlaidApiWrapper(circuitBreaker: CircuitBreakerService) {
  const checkCircuitBreaker = async (): Promise<void> => {
    const isOpen = await circuitBreaker.isCircuitOpen('plaid', PLAID_REGION);
    if (isOpen) {
      throw ProviderException.circuitOpen('plaid');
    }
  };

  const recordSuccess = async (responseTimeMs: number): Promise<void> => {
    await circuitBreaker.recordSuccess('plaid', PLAID_REGION, responseTimeMs);
  };

  const recordFailure = async (error: Error): Promise<void> => {
    await circuitBreaker.recordFailure('plaid', PLAID_REGION, error.message);
  };

  return async function callPlaidApi<T>(operation: string, apiCall: () => Promise<T>): Promise<T> {
    await checkCircuitBreaker();

    const startTime = Date.now();

    try {
      const result = await withTimeout(apiCall, {
        timeoutMs: PLAID_TIMEOUT_MS,
        operationName: `plaid.${operation}`,
      });

      await recordSuccess(Date.now() - startTime);
      return result;
    } catch (error) {
      await recordFailure(error instanceof Error ? error : new Error(String(error)));
      throw mapPlaidError(error, operation);
    }
  };
}
