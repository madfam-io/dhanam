/**
 * English Authentication Translations
 * Login, signup, password reset, 2FA, etc.
 */
export const auth = {
  // Login
  login: 'Sign in',
  loginTitle: 'Sign in to your account',
  loginSubtitle: 'Welcome back',
  email: 'Email',
  password: 'Password',
  rememberMe: 'Remember me',
  forgotPassword: 'Forgot your password?',
  loginButton: 'Sign in',
  loginWith: 'Sign in with {{provider}}',
  tryDemo: 'Try Demo',
  accessingDemo: 'Accessing demo...',
  noAccount: "Don't have an account?",
  signUp: 'Sign up',

  // SSO / OAuth
  signInWithJanua: 'Sign in with Janua SSO',
  orContinueWith: 'Or continue with',
  orContinueWithEmail: 'Or continue with email',

  // Signup
  signup: 'Sign up',
  signupTitle: 'Create your account',
  signupSubtitle: 'Start managing your finances',
  createAccount: 'Create account',
  alreadyHaveAccount: 'Already have an account?',
  dontHaveAccount: "Don't have an account?",
  fullName: 'Full name',
  confirmPassword: 'Confirm password',
  agreeToTerms: 'I agree to the terms and conditions',
  termsAndConditions: 'Terms and conditions',
  privacyPolicy: 'Privacy policy',

  // Password
  passwordRequirements: 'Password requirements',
  passwordMinLength: 'Minimum 8 characters',
  passwordUppercase: 'At least one uppercase letter',
  passwordLowercase: 'At least one lowercase letter',
  passwordNumber: 'At least one number',
  passwordSpecial: 'At least one special character',
  passwordsDoNotMatch: 'Passwords do not match',
  currentPassword: 'Current password',
  newPassword: 'New password',
  confirmNewPassword: 'Confirm new password',
  changePassword: 'Change password',
  passwordChanged: 'Password changed successfully',

  // Password Reset
  resetPassword: 'Reset password',
  resetPasswordTitle: 'Reset your password',
  resetPasswordSubtitle: 'Enter your email to receive instructions',
  sendResetLink: 'Send reset link',
  resetLinkSent: 'Reset link sent',
  checkYourEmail: 'Check your email',
  resetLinkExpired: 'The reset link has expired',
  requestNewLink: 'Request new link',
  setNewPassword: 'Set new password',

  // Email Verification
  verifyEmail: 'Verify email',
  emailNotVerified: 'Email not verified',
  verificationEmailSent: 'Verification email sent',
  resendVerificationEmail: 'Resend verification email',
  emailVerified: 'Email verified successfully',
  verifyYourEmail: 'Verify your email',
  verificationLinkExpired: 'The verification link has expired',

  // 2FA / TOTP
  twoFactorAuth: 'Two-factor authentication',
  enable2FA: 'Enable 2FA',
  disable2FA: 'Disable 2FA',
  '2FAEnabled': '2FA enabled',
  '2FADisabled': '2FA disabled',
  enterTotpCode: 'Enter the 6-digit code',
  totpCode: 'TOTP code',
  invalidTotpCode: 'Invalid code',
  scanQRCode: 'Scan the QR code',
  cantScanQR: "Can't scan the QR?",
  enterManually: 'Enter manually',
  secretKey: 'Secret key',
  backupCodes: 'Backup codes',
  saveBackupCodes: 'Save these backup codes',
  backupCodesWarning: 'Each code can only be used once',
  downloadBackupCodes: 'Download backup codes',
  useBackupCode: 'Use backup code',
  regenerateBackupCodes: 'Regenerate backup codes',

  // Sessions
  activeSessions: 'Active sessions',
  currentSession: 'Current session',
  lastActive: 'Last active',
  revokeSession: 'Revoke session',
  revokeAllSessions: 'Revoke all sessions',
  sessionRevoked: 'Session revoked',

  // Logout
  logout: 'Sign out',
  logoutConfirm: 'Are you sure you want to sign out?',
  loggedOut: 'Signed out successfully',

  // Errors
  invalidCredentials: 'Invalid email or password',
  accountNotFound: 'Account not found',
  emailAlreadyExists: 'Email is already registered',
  accountDisabled: 'Account disabled',
  accountLocked: 'Account locked',
  tooManyAttempts: 'Too many attempts. Please try again later',
  sessionExpired: 'Session expired',
  unauthorized: 'Unauthorized',
  forbidden: 'Access denied',
  tokenInvalid: 'Invalid token',
  tokenExpired: 'Token expired',
  totpRequired: 'Please enter your 2FA code',
  invalidTotp: 'Invalid 2FA code. Please try again',
  genericError: 'An error occurred. Please try again',
  demoAccessFailed: 'Failed to access demo. Please try again',

  // Success
  loginSuccessful: 'Login successful',
  signupSuccessful: 'Signup successful',
  welcomeBack: 'Welcome back, {{name}}',
  accountCreated: 'Account created successfully',
} as const;
