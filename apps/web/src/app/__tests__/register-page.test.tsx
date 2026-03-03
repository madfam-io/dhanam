import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@dhanam/ui', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
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
  authApi: { register: jest.fn() },
}));

jest.mock('~/lib/api/client', () => ({
  ApiError: class ApiError extends Error {},
}));

jest.mock('~/components/forms/register-form', () => ({
  RegisterForm: ({ onSubmit }: any) => (
    <form data-testid="register-form" onSubmit={(e) => { e.preventDefault(); onSubmit({}); }}>
      <button type="submit">Register</button>
    </form>
  ),
}));

jest.mock('~/lib/janua-oauth', () => ({
  oauthProviders: [],
  loginWithOAuth: jest.fn(),
  isJanuaOAuthEnabled: () => false,
}));

import RegisterPage from '../(auth)/register/page';

describe('RegisterPage', () => {
  it('should render the register form', () => {
    render(<RegisterPage />);

    expect(screen.getByText('Create an account')).toBeInTheDocument();
    expect(screen.getByTestId('register-form')).toBeInTheDocument();
  });

  it('should render sign in link', () => {
    render(<RegisterPage />);

    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('should render subtitle', () => {
    render(<RegisterPage />);

    expect(screen.getByText('Start managing your finances with Dhanam')).toBeInTheDocument();
  });
});
