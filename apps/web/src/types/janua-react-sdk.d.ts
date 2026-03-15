declare module '@janua/react-sdk' {
  import { ReactNode } from 'react';

  // ---- Config & Provider ----
  interface JanuaConfig {
    baseURL: string;
    clientId?: string;
    redirectUri?: string;
    debug?: boolean;
  }

  interface JanuaProviderProps {
    config: JanuaConfig;
    children: ReactNode;
  }

  export function JanuaProvider(props: JanuaProviderProps): JSX.Element;

  // ---- User types ----
  interface JanuaUser {
    id: string;
    email: string;
    name?: string;
    display_name?: string;
    avatar_url?: string;
    locale?: string;
    timezone?: string;
    mfa_enabled?: boolean;
    email_verified?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
  }

  // ---- Error types ----
  interface JanuaErrorState {
    code: string;
    message: string;
    status?: number;
    details?: unknown;
  }

  export class JanuaError extends Error {
    statusCode?: number;
    details?: unknown;
  }
  export class AuthenticationError extends JanuaError {}
  export class ValidationError extends JanuaError {
    details?: unknown;
  }
  export class NetworkError extends JanuaError {}
  export class TokenError extends JanuaError {}
  export class OAuthError extends JanuaError {}
  export class ReactJanuaError extends Error {}

  // ---- Hooks ----

  /** Legacy context hook — prefer useAuth for full auth state */
  interface JanuaContextValue {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: JanuaUser | null;
    login: () => void;
    logout: () => void;
  }
  export function useJanua(): JanuaContextValue;

  /** Full auth hook with token management */
  interface UseAuthReturn {
    isSignedIn: boolean;
    isLoaded: boolean;
    user: JanuaUser | null;
    signIn: (credentials?: { email: string; password: string }) => Promise<void>;
    signUp: (data?: { email: string; password: string; name?: string }) => Promise<void>;
    signOut: () => Promise<void>;
    getToken: () => Promise<string | null>;
    error: JanuaErrorState | null;
  }
  export function useAuth(): UseAuthReturn;

  /** Session hook */
  interface SessionData {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
  }
  interface UseSessionReturn {
    session: SessionData | null;
    isLoaded: boolean;
  }
  export function useSession(): UseSessionReturn;

  /** User hook */
  interface UseUserReturn {
    user: JanuaUser | null;
    isLoaded: boolean;
  }
  export function useUser(): UseUserReturn;

  /** MFA hook */
  interface UseMFAReturn {
    isMFAEnabled: boolean;
    setupMFA: () => Promise<{ qrCode: string; secret: string }>;
    verifyMFA: (code: string) => Promise<void>;
    disableMFA: () => Promise<void>;
  }
  export function useMFA(): UseMFAReturn;

  /** Organization hook */
  export function useOrganization(): {
    organization: unknown;
    isLoaded: boolean;
  };

  /** Passkey hook */
  export function usePasskey(): {
    register: () => Promise<void>;
    authenticate: () => Promise<void>;
    isSupported: boolean;
  };

  /** Realtime hook */
  export function useRealtime(): {
    subscribe: (event: string, callback: (data: unknown) => void) => () => void;
  };

  // ---- Components ----

  interface SignInProps {
    redirectUrl?: string;
    afterSignInUrl?: string;
    appearance?: Record<string, unknown>;
  }
  export function SignIn(props: SignInProps): JSX.Element;

  interface SignUpProps {
    redirectUrl?: string;
    afterSignUpUrl?: string;
    appearance?: Record<string, unknown>;
  }
  export function SignUp(props: SignUpProps): JSX.Element;

  interface UserButtonProps {
    afterSignOutUrl?: string;
    appearance?: Record<string, unknown>;
    showName?: boolean;
  }
  export function UserButton(props: UserButtonProps): JSX.Element;

  interface UserProfileProps {
    appearance?: Record<string, unknown>;
  }
  export function UserProfile(props: UserProfileProps): JSX.Element;

  interface ProtectProps {
    children: ReactNode;
    fallback?: ReactNode;
    role?: string;
    permission?: string;
  }
  export function Protect(props: ProtectProps): JSX.Element;

  interface AuthGuardProps {
    children: ReactNode;
    fallback?: ReactNode;
  }
  export function AuthGuard(props: AuthGuardProps): JSX.Element;

  export function SignedIn(props: { children: ReactNode }): JSX.Element;
  export function SignedOut(props: { children: ReactNode }): JSX.Element;

  interface MFAChallengeProps {
    onSuccess?: () => void;
    onCancel?: () => void;
  }
  export function MFAChallenge(props: MFAChallengeProps): JSX.Element;

  interface OrgSwitcherProps {
    appearance?: Record<string, unknown>;
  }
  export function OrgSwitcher(props: OrgSwitcherProps): JSX.Element;

  // ---- PKCE utilities ----
  export function generateCodeVerifier(): string;
  export function generateCodeChallenge(verifier: string): Promise<string>;
  export function generateState(): string;
  export function storePKCEParams(params: Record<string, string>): void;
  export function retrievePKCEParams(): Record<string, string> | null;
  export function clearPKCEParams(): void;
  export function validateState(state: string): boolean;
  export function parseOAuthCallback(url: string): {
    code?: string;
    state?: string;
    error?: string;
  };
  export function buildAuthorizationUrl(params: Record<string, string>): string;

  // ---- Constants ----
  export const SDK_NAME: string;
  export const SDK_VERSION: string;
  export const STORAGE_KEYS: {
    accessToken: string;
    refreshToken: string;
    user: string;
    idToken: string;
  };
  export const PKCE_STORAGE_KEYS: Record<string, string>;

  // ---- OAuth ----
  export const OAuthProvider: Record<string, string>;

  // ---- Error utilities ----
  export function createErrorState(
    code: string,
    message: string,
    status?: number,
    details?: unknown
  ): JanuaErrorState;
  export function getUserFriendlyMessage(error: unknown): string;
  export function isAuthRequiredError(error: JanuaErrorState | null): boolean;
  export function isAuthenticationError(error: unknown): boolean;
  export function isJanuaError(error: unknown): boolean;
  export function isNetworkError(error: unknown): boolean;
  export function isNetworkIssue(error: JanuaErrorState | null): boolean;
  export function isValidationError(error: unknown): boolean;
  export function mapErrorToState(error: unknown): JanuaErrorState;
}
