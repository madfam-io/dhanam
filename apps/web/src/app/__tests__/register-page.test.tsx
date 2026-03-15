import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@dhanam/ui', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardFooter: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('~/components/locale-switcher', () => ({
  LocaleSwitcher: () => <div data-testid="locale-switcher" />,
}));

jest.mock('@janua/react-sdk', () => ({
  SignUp: ({ redirectUrl }: any) => (
    <div data-testid="janua-sign-up" data-redirect-url={redirectUrl}>
      Janua Sign Up
    </div>
  ),
}));

import RegisterPage from '../(auth)/register/page';

describe('RegisterPage', () => {
  it('should render the Janua SignUp component', () => {
    render(<RegisterPage />);

    expect(screen.getByTestId('janua-sign-up')).toBeInTheDocument();
    expect(screen.getByTestId('janua-sign-up')).toHaveAttribute('data-redirect-url', '/onboarding');
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
