/**
 * Spanish Authentication Translations
 * Login, signup, password reset, 2FA, etc.
 */
export const auth = {
  // Login
  login: 'Iniciar sesión',
  loginTitle: 'Inicia sesión en tu cuenta',
  loginSubtitle: 'Bienvenido de nuevo',
  email: 'Correo electrónico',
  password: 'Contraseña',
  rememberMe: 'Recordarme',
  forgotPassword: '¿Olvidaste tu contraseña?',
  loginButton: 'Iniciar sesión',
  loginWith: 'Iniciar sesión con {{provider}}',

  // Signup
  signup: 'Registrarse',
  signupTitle: 'Crea tu cuenta',
  signupSubtitle: 'Comienza a administrar tus finanzas',
  createAccount: 'Crear cuenta',
  alreadyHaveAccount: '¿Ya tienes una cuenta?',
  dontHaveAccount: '¿No tienes una cuenta?',
  fullName: 'Nombre completo',
  confirmPassword: 'Confirmar contraseña',
  agreeToTerms: 'Acepto los términos y condiciones',
  termsAndConditions: 'Términos y condiciones',
  privacyPolicy: 'Política de privacidad',

  // Password
  passwordRequirements: 'Requisitos de contraseña',
  passwordMinLength: 'Mínimo 8 caracteres',
  passwordUppercase: 'Al menos una mayúscula',
  passwordLowercase: 'Al menos una minúscula',
  passwordNumber: 'Al menos un número',
  passwordSpecial: 'Al menos un carácter especial',
  passwordsDoNotMatch: 'Las contraseñas no coinciden',
  currentPassword: 'Contraseña actual',
  newPassword: 'Nueva contraseña',
  confirmNewPassword: 'Confirmar nueva contraseña',
  changePassword: 'Cambiar contraseña',
  passwordChanged: 'Contraseña cambiada exitosamente',

  // Password Reset
  resetPassword: 'Restablecer contraseña',
  resetPasswordTitle: 'Restablece tu contraseña',
  resetPasswordSubtitle: 'Ingresa tu correo para recibir instrucciones',
  sendResetLink: 'Enviar enlace de restablecimiento',
  resetLinkSent: 'Enlace de restablecimiento enviado',
  checkYourEmail: 'Revisa tu correo electrónico',
  resetLinkExpired: 'El enlace de restablecimiento ha expirado',
  requestNewLink: 'Solicitar nuevo enlace',
  setNewPassword: 'Establecer nueva contraseña',

  // Email Verification
  verifyEmail: 'Verificar correo electrónico',
  emailNotVerified: 'Correo no verificado',
  verificationEmailSent: 'Correo de verificación enviado',
  resendVerificationEmail: 'Reenviar correo de verificación',
  emailVerified: 'Correo verificado exitosamente',
  verifyYourEmail: 'Verifica tu correo electrónico',
  verificationLinkExpired: 'El enlace de verificación ha expirado',

  // 2FA / TOTP
  twoFactorAuth: 'Autenticación de dos factores',
  enable2FA: 'Habilitar 2FA',
  disable2FA: 'Deshabilitar 2FA',
  '2FAEnabled': '2FA habilitado',
  '2FADisabled': '2FA deshabilitado',
  enterTotpCode: 'Ingresa el código de 6 dígitos',
  totpCode: 'Código TOTP',
  invalidTotpCode: 'Código inválido',
  scanQRCode: 'Escanea el código QR',
  cantScanQR: '¿No puedes escanear el QR?',
  enterManually: 'Ingresa manualmente',
  secretKey: 'Clave secreta',
  backupCodes: 'Códigos de respaldo',
  saveBackupCodes: 'Guarda estos códigos de respaldo',
  backupCodesWarning: 'Cada código solo se puede usar una vez',
  downloadBackupCodes: 'Descargar códigos de respaldo',
  useBackupCode: 'Usar código de respaldo',
  regenerateBackupCodes: 'Regenerar códigos de respaldo',

  // Sessions
  activeSessions: 'Sesiones activas',
  currentSession: 'Sesión actual',
  lastActive: 'Última actividad',
  revokeSession: 'Revocar sesión',
  revokeAllSessions: 'Revocar todas las sesiones',
  sessionRevoked: 'Sesión revocada',

  // Logout
  logout: 'Cerrar sesión',
  logoutConfirm: '¿Estás seguro de que deseas cerrar sesión?',
  loggedOut: 'Sesión cerrada exitosamente',

  // Errors
  invalidCredentials: 'Credenciales inválidas',
  accountNotFound: 'Cuenta no encontrada',
  emailAlreadyExists: 'El correo ya está registrado',
  accountDisabled: 'Cuenta deshabilitada',
  accountLocked: 'Cuenta bloqueada',
  tooManyAttempts: 'Demasiados intentos. Intenta más tarde',
  sessionExpired: 'Sesión expirada',
  unauthorized: 'No autorizado',
  forbidden: 'Acceso denegado',
  tokenInvalid: 'Token inválido',
  tokenExpired: 'Token expirado',

  // Success
  loginSuccessful: 'Inicio de sesión exitoso',
  signupSuccessful: 'Registro exitoso',
  welcomeBack: 'Bienvenido de nuevo, {{name}}',
  accountCreated: 'Cuenta creada exitosamente',
} as const;
