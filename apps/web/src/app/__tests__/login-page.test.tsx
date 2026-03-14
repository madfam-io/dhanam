import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock all UI components
jest.mock('@dhanam/ui', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardFooter: ({ children }: any) => <div>{children}</div>,
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <span>{children}</span>,
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Separator: () => <hr />,
}));

jest.mock('@dhanam/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: jest.fn(),
    hasKey: () => true,
    getNamespace: () => ({}),
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('~/lib/hooks/use-auth', () => ({
  useAuth: () => ({ setAuth: jest.fn() }),
}));

jest.mock('~/lib/api/auth', () => ({
  authApi: { login: jest.fn(), loginAsGuest: jest.fn() },
}));

jest.mock('~/lib/api/client', () => ({
  ApiError: class ApiError extends Error {},
}));

jest.mock('~/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    identifyUser: jest.fn(),
    track: jest.fn(),
  }),
}));

jest.mock('~/components/forms/login-form', () => ({
  LoginForm: ({ onSubmit }: any) => (
    <form data-testid="login-form" onSubmit={(e) => { e.preventDefault(); onSubmit({}); }}>
      <button type="submit">Submit</button>
    </form>
  ),
}));

jest.mock('~/components/locale-switcher', () => ({
  LocaleSwitcher: () => <div data-testid="locale-switcher" />,
}));

jest.mock('~/lib/janua-oauth', () => ({
  oauthProviders: [],
  loginWithOAuth: jest.fn(),
  loginWithJanuaSSO: jest.fn(),
  isJanuaOAuthEnabled: () => false,
}));

import LoginPage from '../(auth)/login/page';

describe('LoginPage', () => {
  it('should render the login form', () => {
    render(<LoginPage />);

    expect(screen.getByText('loginTitle')).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('should render locale switcher', () => {
    render(<LoginPage />);

    expect(screen.getByTestId('locale-switcher')).toBeInTheDocument();
  });

  it('should render demo button', () => {
    render(<LoginPage />);

    expect(screen.getByText('tryDemo')).toBeInTheDocument();
  });

  it('should render sign up link', () => {
    render(<LoginPage />);

    expect(screen.getByText('signUp')).toBeInTheDocument();
  });

  it('should render forgot password link', () => {
    render(<LoginPage />);

    expect(screen.getByText('forgotPassword')).toBeInTheDocument();
  });
});
