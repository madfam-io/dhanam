import {
  AuthTokens,
  ForgotPasswordDto,
  LoginDto,
  RATE_LIMIT_PRESETS,
  RegisterDto,
  ResetPasswordDto,
} from '@dhanam/shared';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuditService } from '@core/audit/audit.service';
import { SecurityConfigService } from '@core/config/security.config';

import { AuthController } from '../auth.controller';
import { DemoAuthService } from '../demo-auth.service';
import { GuestAuthService } from '../guest-auth.service';
import { AUTH_PROVIDER, MFA_PROVIDER } from '../providers';
import { TotpSetupResponse } from '../totp.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authProvider: Record<string, jest.Mock>;
  let mfaProvider: Record<string, jest.Mock>;
  let auditService: Record<string, jest.Mock>;

  const mockTokens: AuthTokens = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
    expiresIn: 900,
  };

  const mockSetupResponse: TotpSetupResponse = {
    qrCodeUrl: 'data:image/png;base64,abc',
    secret: 'JBSWY3DPEHPK3PXP',
    manualEntryKey: 'JBSWY3DPEHPK3PXP',
  };

  const mockRes = {
    setCookie: jest.fn(),
    clearCookie: jest.fn(),
  } as any;

  beforeEach(async () => {
    authProvider = {
      register: jest.fn().mockResolvedValue(mockTokens),
      login: jest.fn().mockResolvedValue(mockTokens),
      refreshTokens: jest.fn().mockResolvedValue(mockTokens),
      logout: jest.fn().mockResolvedValue(undefined),
      forgotPassword: jest.fn().mockResolvedValue(undefined),
      resetPassword: jest.fn().mockResolvedValue(undefined),
    };

    mfaProvider = {
      setupTotp: jest.fn().mockResolvedValue(mockSetupResponse),
      enableTotp: jest.fn().mockResolvedValue(undefined),
      disableTotp: jest.fn().mockResolvedValue(undefined),
      generateBackupCodes: jest.fn().mockReturnValue(['ABCD1234', 'EFGH5678']),
      storeBackupCodes: jest.fn().mockResolvedValue(undefined),
    };

    auditService = {
      logEvent: jest.fn().mockResolvedValue(undefined),
      logAuthSuccess: jest.fn().mockResolvedValue(undefined),
      logAuthFailure: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot()],
      controllers: [AuthController],
      providers: [
        { provide: AUTH_PROVIDER, useValue: authProvider },
        { provide: MFA_PROVIDER, useValue: mfaProvider },
        { provide: AuditService, useValue: auditService },
        {
          provide: GuestAuthService,
          useValue: {
            createGuestSession: jest.fn().mockResolvedValue({
              accessToken: 'guest-token',
              refreshToken: 'guest-refresh',
              expiresIn: 3600,
              user: { id: 'guest-1', email: 'guest@demo', name: 'Guest' },
            }),
          },
        },
        {
          provide: DemoAuthService,
          useValue: {
            loginAsPersona: jest.fn(),
            switchPersona: jest.fn(),
            getAvailablePersonas: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: SecurityConfigService,
          useValue: {
            getRefreshTokenExpirySeconds: jest.fn().mockReturnValue(2592000),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should delegate to AUTH_PROVIDER.register', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'SecureP@ss123',
        name: 'Test',
      };

      const result = await controller.register(dto, '127.0.0.1', 'test-agent', mockRes);

      expect(authProvider.register).toHaveBeenCalledWith(dto);
      expect(result.tokens.accessToken).toBe(mockTokens.accessToken);
      expect(mockRes.setCookie).toHaveBeenCalledWith(
        'refresh_token',
        mockTokens.refreshToken,
        expect.objectContaining({ httpOnly: true })
      );
    });

    it('should audit registration', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'SecureP@ss123',
        name: 'Test',
      };

      await controller.register(dto, '127.0.0.1', 'test-agent', mockRes);

      expect(auditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_REGISTERED',
          metadata: { email: dto.email },
        })
      );
    });
  });

  describe('login', () => {
    it('should delegate to AUTH_PROVIDER.login', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'pass' };

      const result = await controller.login(dto, '127.0.0.1', 'test-agent', mockRes);

      expect(authProvider.login).toHaveBeenCalledWith(dto);
      expect(result.tokens.accessToken).toBe(mockTokens.accessToken);
    });

    it('should audit failed login attempts', async () => {
      const error = new Error('Invalid credentials');
      authProvider.login.mockRejectedValueOnce(error);
      const dto: LoginDto = { email: 'bad@example.com', password: 'wrong' };

      await expect(controller.login(dto, '127.0.0.1', 'test-agent', mockRes)).rejects.toThrow();
      expect(auditService.logAuthFailure).toHaveBeenCalledWith(
        'bad@example.com',
        '127.0.0.1',
        'test-agent'
      );
    });
  });

  describe('refreshTokens', () => {
    it('should delegate to AUTH_PROVIDER.refreshTokens', async () => {
      const result = await controller.refreshTokens(
        { refreshToken: 'old-token' },
        '',
        mockRes
      );

      expect(authProvider.refreshTokens).toHaveBeenCalledWith('old-token');
      expect(result.tokens.accessToken).toBe(mockTokens.accessToken);
    });

    it('should prefer cookie over body', async () => {
      await controller.refreshTokens(
        { refreshToken: 'body-token' },
        'refresh_token=cookie-token',
        mockRes
      );

      expect(authProvider.refreshTokens).toHaveBeenCalledWith('cookie-token');
    });
  });

  describe('logout', () => {
    it('should delegate to AUTH_PROVIDER.logout', async () => {
      await controller.logout({ refreshToken: 'my-token' }, '', mockRes);

      expect(authProvider.logout).toHaveBeenCalledWith('my-token');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refresh_token', {
        path: '/v1/auth/refresh',
      });
    });
  });

  describe('forgotPassword', () => {
    it('should delegate to AUTH_PROVIDER.forgotPassword', async () => {
      const dto: ForgotPasswordDto = { email: 'test@example.com' };

      const result = await controller.forgotPassword(dto);

      expect(authProvider.forgotPassword).toHaveBeenCalledWith(dto);
      expect(result.message).toBe('If the email exists, a reset link has been sent');
    });
  });

  describe('resetPassword', () => {
    it('should delegate to AUTH_PROVIDER.resetPassword', async () => {
      const dto: ResetPasswordDto = { token: 'tok', newPassword: 'NewPass123!' };

      const result = await controller.resetPassword(dto);

      expect(authProvider.resetPassword).toHaveBeenCalledWith(dto);
      expect(result.message).toBe('Password reset successful');
    });
  });

  describe('TOTP endpoints', () => {
    const mockUser = { userId: 'user-123', email: 'test@example.com' } as any;

    it('setupTotp should delegate to MFA_PROVIDER', async () => {
      const result = await controller.setupTotp(mockUser);

      expect(mfaProvider.setupTotp).toHaveBeenCalledWith('user-123', 'test@example.com');
      expect(result).toEqual(mockSetupResponse);
    });

    it('enableTotp should delegate to MFA_PROVIDER', async () => {
      const result = await controller.enableTotp(mockUser, { token: '123456' });

      expect(mfaProvider.enableTotp).toHaveBeenCalledWith('user-123', '123456');
      expect(result.message).toBe('TOTP enabled successfully');
    });

    it('disableTotp should delegate to MFA_PROVIDER', async () => {
      const result = await controller.disableTotp(mockUser, { token: '654321' });

      expect(mfaProvider.disableTotp).toHaveBeenCalledWith('user-123', '654321');
      expect(result.message).toBe('TOTP disabled successfully');
    });

    it('generateBackupCodes should delegate to MFA_PROVIDER', async () => {
      const result = await controller.generateBackupCodes(mockUser);

      expect(mfaProvider.generateBackupCodes).toHaveBeenCalled();
      expect(mfaProvider.storeBackupCodes).toHaveBeenCalledWith('user-123', [
        'ABCD1234',
        'EFGH5678',
      ]);
      expect(result.codes).toEqual(['ABCD1234', 'EFGH5678']);
    });
  });

  describe('guest and demo endpoints', () => {
    it('guestLogin should not use AUTH_PROVIDER', async () => {
      await controller.guestLogin({}, '127.0.0.1', 'agent', '');

      expect(authProvider.register).not.toHaveBeenCalled();
      expect(authProvider.login).not.toHaveBeenCalled();
    });
  });
});
