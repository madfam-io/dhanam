import { GoneException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { JanuaAuthProvider } from '../providers/janua-auth.provider';

describe('JanuaAuthProvider', () => {
  let provider: JanuaAuthProvider;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('https://auth.madfam.io'),
    } as any;
    provider = new JanuaAuthProvider(configService);
  });

  describe('auth endpoints return 410 Gone with redirect info', () => {
    it('register should throw GoneException with redirect URL', async () => {
      try {
        await provider.register({ email: 'test@example.com', password: 'pass', name: 'Test' });
        fail('Expected GoneException');
      } catch (err) {
        expect(err).toBeInstanceOf(GoneException);
        const response = (err as GoneException).getResponse() as any;
        expect(response.redirectUrl).toBe('https://auth.madfam.io/register');
        expect(response.authMode).toBe('janua');
      }
    });

    it('login should throw GoneException with redirect URL', async () => {
      try {
        await provider.login({ email: 'test@example.com', password: 'pass' });
        fail('Expected GoneException');
      } catch (err) {
        expect(err).toBeInstanceOf(GoneException);
        const response = (err as GoneException).getResponse() as any;
        expect(response.redirectUrl).toBe('https://auth.madfam.io/login');
      }
    });

    it('refreshTokens should throw GoneException with token endpoint', async () => {
      try {
        await provider.refreshTokens('some-token');
        fail('Expected GoneException');
      } catch (err) {
        expect(err).toBeInstanceOf(GoneException);
        const response = (err as GoneException).getResponse() as any;
        expect(response.tokenEndpoint).toBe('https://auth.madfam.io/oauth/token');
      }
    });

    it('logout should throw GoneException with redirect URL', async () => {
      try {
        await provider.logout('token');
        fail('Expected GoneException');
      } catch (err) {
        expect(err).toBeInstanceOf(GoneException);
        const response = (err as GoneException).getResponse() as any;
        expect(response.redirectUrl).toBe('https://auth.madfam.io/logout');
      }
    });

    it('forgotPassword should throw GoneException with redirect URL', async () => {
      try {
        await provider.forgotPassword({ email: 'test@example.com' });
        fail('Expected GoneException');
      } catch (err) {
        expect(err).toBeInstanceOf(GoneException);
        const response = (err as GoneException).getResponse() as any;
        expect(response.redirectUrl).toBe('https://auth.madfam.io/forgot-password');
      }
    });

    it('resetPassword should throw GoneException with redirect URL', async () => {
      try {
        await provider.resetPassword({ token: 'tok', newPassword: 'pass' });
        fail('Expected GoneException');
      } catch (err) {
        expect(err).toBeInstanceOf(GoneException);
        const response = (err as GoneException).getResponse() as any;
        expect(response.redirectUrl).toBe('https://auth.madfam.io/forgot-password');
      }
    });
  });

  describe('interface compliance', () => {
    it('should implement all AuthProvider methods', () => {
      expect(typeof provider.register).toBe('function');
      expect(typeof provider.login).toBe('function');
      expect(typeof provider.refreshTokens).toBe('function');
      expect(typeof provider.logout).toBe('function');
      expect(typeof provider.forgotPassword).toBe('function');
      expect(typeof provider.resetPassword).toBe('function');
    });
  });
});
