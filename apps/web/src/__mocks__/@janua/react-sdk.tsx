import React from 'react';

// Configurable mock state for tests
let mockAuthState = {
  isSignedIn: false,
  isLoaded: true,
  user: null as any,
  error: null as any,
};

export function __setMockAuthState(state: Partial<typeof mockAuthState>) {
  mockAuthState = { ...mockAuthState, ...state };
}

export function __resetMockAuthState() {
  mockAuthState = { isSignedIn: false, isLoaded: true, user: null, error: null };
}

// Provider — passthrough
export function JanuaProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Hooks
export function useAuth() {
  return {
    isSignedIn: mockAuthState.isSignedIn,
    isLoaded: mockAuthState.isLoaded,
    user: mockAuthState.user,
    signIn: jest.fn().mockResolvedValue(undefined),
    signUp: jest.fn().mockResolvedValue(undefined),
    signOut: jest.fn().mockResolvedValue(undefined),
    getToken: jest.fn().mockResolvedValue('mock-token'),
    error: mockAuthState.error,
  };
}

export function useJanua() {
  return {
    isAuthenticated: mockAuthState.isSignedIn,
    isLoading: !mockAuthState.isLoaded,
    user: mockAuthState.user,
    login: jest.fn(),
    logout: jest.fn(),
  };
}

export function useSession() {
  return {
    session: mockAuthState.isSignedIn
      ? { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' }
      : null,
    isLoaded: mockAuthState.isLoaded,
  };
}

export function useUser() {
  return {
    user: mockAuthState.user,
    isLoaded: mockAuthState.isLoaded,
  };
}

export function useMFA() {
  return {
    isMFAEnabled: false,
    setupMFA: jest.fn(),
    verifyMFA: jest.fn(),
    disableMFA: jest.fn(),
  };
}

// Components
export function SignIn({ redirectUrl }: { redirectUrl?: string }) {
  return (
    <div data-testid="janua-sign-in" data-redirect-url={redirectUrl}>
      Janua Sign In
    </div>
  );
}

export function SignUp({ redirectUrl }: { redirectUrl?: string }) {
  return (
    <div data-testid="janua-sign-up" data-redirect-url={redirectUrl}>
      Janua Sign Up
    </div>
  );
}

export function UserButton({
  afterSignOutUrl,
  showName,
}: {
  afterSignOutUrl?: string;
  showName?: boolean;
}) {
  return <div data-testid="janua-user-button">User Button</div>;
}

export function UserProfile() {
  return <div data-testid="janua-user-profile">User Profile</div>;
}

export function Protect({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return mockAuthState.isSignedIn ? <>{children}</> : <>{fallback}</>;
}

export function AuthGuard({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return mockAuthState.isSignedIn ? <>{children}</> : <>{fallback}</>;
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  return mockAuthState.isSignedIn ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  return !mockAuthState.isSignedIn ? <>{children}</> : null;
}

export function MFAChallenge() {
  return <div data-testid="janua-mfa-challenge">MFA Challenge</div>;
}

export function OrgSwitcher() {
  return <div data-testid="janua-org-switcher">Org Switcher</div>;
}
