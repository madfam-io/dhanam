import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './register-form';

// Mock @dhanam/ui as simple HTML elements
jest.mock('@dhanam/ui', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Input: React.forwardRef(({ ...props }: any, ref: any) => <input ref={ref} {...props} />),
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

// Mock @dhanam/shared with useTranslation
const authTranslations: Record<string, string> = {
  email: 'Email',
  password: 'Password',
  fullName: 'Full Name',
  createAccount: 'Create account',
  creatingAccount: 'Creating account...',
  passwordHelp: 'Must contain at least 8 characters, one uppercase letter, and one number',
  agreementPrefix: 'By creating an account, you agree to our',
  termsOfService: 'Terms of Service',
  privacyPolicy: 'Privacy Policy',
  'placeholders.email': 'you@example.com',
  'placeholders.password': '••••••••',
  'placeholders.fullName': 'John Doe',
};

const commonTranslations: Record<string, string> = {
  and: 'and',
};

const validationTranslations: Record<string, string> = {
  emailInvalid: 'Invalid email address',
  passwordMinLength: 'Password must be at least {{min}} characters',
  passwordUppercase: 'Password must contain at least one uppercase letter',
  passwordNumber: 'Password must contain at least one number',
  nameMinLength: 'Name must be at least {{min}} characters',
};

jest.mock('@dhanam/shared', () => ({
  RegisterDto: {},
  useTranslation: (namespace?: string) => ({
    t: (key: string, params?: Record<string, string | number>) => {
      const map =
        namespace === 'validations'
          ? validationTranslations
          : namespace === 'common'
            ? commonTranslations
            : authTranslations;
      let value = map[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{{${k}}}`, String(v));
        });
      }
      return value;
    },
    locale: 'en',
    setLocale: jest.fn(),
    hasKey: () => true,
    getNamespace: () => ({}),
  }),
  getGeoDefaults: () => ({
    locale: 'es',
    currency: 'MXN',
    timezone: 'America/Mexico_City',
    region: 'latam',
  }),
}));

// Mock lucide-react icons as spans with test IDs
jest.mock('lucide-react', () => ({
  Eye: (props: any) => <span data-testid="eye-icon" {...props} />,
  EyeOff: (props: any) => <span data-testid="eye-off-icon" {...props} />,
  Loader2: (props: any) => <span data-testid="loader-icon" {...props} />,
}));

describe('RegisterForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('should render all form fields', () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  });

  it('should render password toggle button', () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    // Initially shows Eye icon (password hidden)
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
  });

  it('should toggle password visibility on click', async () => {
    const user = userEvent.setup();
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle
    const toggleButton = screen.getByTestId('eye-icon').closest('button')!;
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();

    // Click again to hide
    const toggleAgain = screen.getByTestId('eye-off-icon').closest('button')!;
    await user.click(toggleAgain);

    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it.skip('should show validation errors for empty fields on submit', async () => {
    const user = userEvent.setup();
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it.skip('should show validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'StrongPass1');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    // Form should not submit with invalid email
    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it.skip('should show validation error for weak password', async () => {
    const user = userEvent.setup();
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'weak');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it.skip('should show error when password missing uppercase letter', async () => {
    const user = userEvent.setup();
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'password1');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(
        screen.getByText('Password must contain at least one uppercase letter')
      ).toBeInTheDocument();
    });
  });

  it.skip('should show error when password missing number', async () => {
    const user = userEvent.setup();
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'Passwordd');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument();
    });
  });

  it('should call onSubmit with valid form data', async () => {
    const user = userEvent.setup();
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password1');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password1',
          locale: 'es',
          timezone: 'America/Mexico_City',
        }),
        expect.anything()
      );
    });
  });

  it('should show loading state when isLoading is true', () => {
    render(<RegisterForm onSubmit={mockOnSubmit} isLoading />);

    expect(screen.getByText('Creating account...')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    expect(screen.getByLabelText('Full Name')).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
  });

  it('should render links to Terms of Service and Privacy Policy', () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    const termsLink = screen.getByText('Terms of Service');
    const privacyLink = screen.getByText('Privacy Policy');

    expect(termsLink).toBeInTheDocument();
    expect(termsLink.closest('a')).toHaveAttribute('href', '/terms');
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink.closest('a')).toHaveAttribute('href', '/privacy');
  });

  it('should display password requirements hint', () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    expect(
      screen.getByText('Must contain at least 8 characters, one uppercase letter, and one number')
    ).toBeInTheDocument();
  });
});
