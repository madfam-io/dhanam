declare module '@janua/react-sdk' {
  import { ReactNode } from 'react';

  interface JanuaUser {
    id: string;
    email: string;
    name?: string;
    display_name?: string;
    locale?: string;
    timezone?: string;
    mfa_enabled?: boolean;
    email_verified?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
  }

  interface JanuaConfig {
    baseURL: string;
    debug?: boolean;
  }

  interface JanuaContextValue {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: JanuaUser | null;
    login: () => void;
    logout: () => void;
  }

  export function JanuaProvider(props: { config: JanuaConfig; children: ReactNode }): JSX.Element;

  export function useJanua(): JanuaContextValue;
}
