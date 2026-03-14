import React from 'react';
import { render, screen, act } from '@testing-library/react';

const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockGet }),
}));

jest.mock('@dhanam/shared', () => ({
  useTranslation: (ns?: string) => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: jest.fn(),
  }),
}));

const mockExchangeCodeForTokens = jest.fn();
const mockGetStoredCodeVerifier = jest.fn();
const mockClearStoredCodeVerifier = jest.fn();

jest.mock('~/lib/janua-oauth', () => ({
  exchangeCodeForTokens: (...args: any[]) => mockExchangeCodeForTokens(...args),
  getStoredCodeVerifier: () => mockGetStoredCodeVerifier(),
  clearStoredCodeVerifier: () => mockClearStoredCodeVerifier(),
}));

import AuthCallbackPage from '../auth/callback/page';

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGet.mockReturnValue(null);
    mockGetStoredCodeVerifier.mockReturnValue(null);
    // Suppress console.error for expected OAuth errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should render error state when no code is present', () => {
    render(<AuthCallbackPage />);
    // Without an authorization code, the page shows an error
    expect(screen.getByText('signInFailed')).toBeInTheDocument();
    expect(screen.getByText('noAuthorizationCode')).toBeInTheDocument();
  });

  it('should show error state when OAuth error param is present', async () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'error') return 'access_denied';
      if (key === 'error_description') return 'User denied access';
      return null;
    });

    await act(async () => {
      render(<AuthCallbackPage />);
    });

    expect(screen.getByText('signInFailed')).toBeInTheDocument();
    expect(screen.getByText('User denied access')).toBeInTheDocument();
  });

  it('should show error state when authorization code is missing', async () => {
    // No code, no error params
    mockGet.mockReturnValue(null);

    await act(async () => {
      render(<AuthCallbackPage />);
    });

    expect(screen.getByText('signInFailed')).toBeInTheDocument();
    expect(screen.getByText('noAuthorizationCode')).toBeInTheDocument();
  });

  it('should show error state when PKCE code verifier is missing', async () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'code') return 'auth-code-123';
      return null;
    });
    mockGetStoredCodeVerifier.mockReturnValue(null);

    await act(async () => {
      render(<AuthCallbackPage />);
    });

    expect(screen.getByText('signInFailed')).toBeInTheDocument();
    expect(screen.getByText('sessionExpiredRetry')).toBeInTheDocument();
  });

  it('should show success state on successful token exchange', async () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'code') return 'auth-code-123';
      return null;
    });
    mockGetStoredCodeVerifier.mockReturnValue('verifier-xyz');
    mockExchangeCodeForTokens.mockResolvedValue({
      access_token: 'access-token-abc',
      refresh_token: 'refresh-token-def',
    });

    // Mock localStorage
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });

    await act(async () => {
      render(<AuthCallbackPage />);
    });

    expect(screen.getByText('signInSuccessful')).toBeInTheDocument();
    expect(screen.getByText('redirectingToDashboard')).toBeInTheDocument();
    expect(mockClearStoredCodeVerifier).toHaveBeenCalled();

    setItemSpy.mockRestore();
  });
});
