import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from '../roles.guard';
import { ROLES_KEY } from '../../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const createMockExecutionContext = (user?: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: mockReflector }],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockExecutionContext({ id: 'user-123' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return false when roles array is empty but ADMIN check fails', () => {
      // Empty array is truthy, so the guard proceeds to check ADMIN role
      reflector.getAllAndOverride.mockReturnValue([]);
      const context = createMockExecutionContext({ id: 'user-123', isAdmin: false });

      const result = guard.canActivate(context);

      // With empty array, requiredRoles.includes('ADMIN') is false, and user.isAdmin !== true
      // So the condition: requiredRoles.includes('ADMIN') && user?.isAdmin === true is false
      expect(result).toBe(false);
    });

    it('should return true when user has ADMIN role and isAdmin flag', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = createMockExecutionContext({
        id: 'admin-user',
        isAdmin: true,
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return false when ADMIN role required but user is not admin', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = createMockExecutionContext({
        id: 'regular-user',
        isAdmin: false,
      });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when ADMIN role required but user has no isAdmin flag', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = createMockExecutionContext({
        id: 'user-without-admin-flag',
      });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when no user in request', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = createMockExecutionContext(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user is null', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = createMockExecutionContext(null);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should check roles from both handler and class', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const mockHandler = jest.fn();
      const mockClass = jest.fn();

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'user', isAdmin: true } }),
        }),
        getHandler: () => mockHandler,
        getClass: () => mockClass,
      } as unknown as ExecutionContext;

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockHandler,
        mockClass,
      ]);
    });

    it('should return false for non-ADMIN required roles (current implementation)', () => {
      // Current implementation only checks for ADMIN role specifically
      reflector.getAllAndOverride.mockReturnValue(['USER']);
      const context = createMockExecutionContext({
        id: 'user-123',
        isAdmin: false,
      });

      const result = guard.canActivate(context);

      // Since requiredRoles.includes('ADMIN') is false, this will return false
      // when user.isAdmin !== true
      expect(result).toBe(false);
    });

    it('should handle multiple required roles including ADMIN', () => {
      reflector.getAllAndOverride.mockReturnValue(['USER', 'ADMIN', 'MODERATOR']);
      const context = createMockExecutionContext({
        id: 'admin-user',
        isAdmin: true,
      });

      const result = guard.canActivate(context);

      // Should return true because requiredRoles includes 'ADMIN' and user.isAdmin is true
      expect(result).toBe(true);
    });

    it('should handle multiple required roles without ADMIN', () => {
      reflector.getAllAndOverride.mockReturnValue(['USER', 'MODERATOR']);
      const context = createMockExecutionContext({
        id: 'user-123',
        isAdmin: false,
      });

      const result = guard.canActivate(context);

      // Current implementation returns false because ADMIN is not in required roles
      // OR user is not admin
      expect(result).toBe(false);
    });
  });

  describe('role decorator integration', () => {
    it('should work with ROLES_KEY constant', () => {
      expect(ROLES_KEY).toBe('roles');
    });
  });
});
