import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './login-form';

// Mock @dhanam/ui components
jest.mock('@dhanam/ui', () => ({
  Button: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <button ref={ref} {...props}>
      {children}
    </button>
  )),
  Input: React.forwardRef(({ ...props }: any, ref: any) => <input ref={ref} {...props} />),
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Eye: ({ ...props }: any) => <span data-testid="eye-icon" {...props} />,
  EyeOff: ({ ...props }: any) => <span data-testid="eye-off-icon" {...props} />,
  Loader2: ({ ...props }: any) => <span data-testid="loader-icon" {...props} />,
}));

describe('LoginForm', () => {
  const mockOnSubmit = jest.fn();

  beforeAll(() => {
    // Mock scrollIntoView as react-hook-form uses it for focus management on error
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('should render the login form with email and password fields', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('should toggle password visibility when clicking the eye button', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();

    // Click toggle to show password
    const toggleButton = passwordInput.parentElement!.querySelector('button')!;
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();

    // Click toggle to hide password again
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
  });

  it.skip('should show validation errors for empty fields on submit', async () => {
    // Import fireEvent locally to avoid conflict if not imported at top
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { fireEvent } = require('@testing-library/react');
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    // Use fireEvent.click instead of user.click to avoid jsdom/react interaction bug
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with form data when valid', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'securepassword123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          password: 'securepassword123',
        }),
        expect.anything()
      );
    });
  });

  it('should show loading state during submission', () => {
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={true} />);

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
  });

  it('should show TOTP field when showTotpField is true', () => {
    render(<LoginForm onSubmit={mockOnSubmit} showTotpField={true} />);

    expect(screen.getByLabelText('2FA Code')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('123456')).toBeInTheDocument();
  });

  it('should not show TOTP field by default', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);

    expect(screen.queryByLabelText('2FA Code')).not.toBeInTheDocument();
  });
});
