import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@core/prisma/prisma.service';
import { LoggerService } from '@core/logger/logger.service';

export const ADMIN_ROLE_KEY = 'adminRole';
export const AdminRole = (role?: string) => (target: any, key?: string | symbol, descriptor?: any) => {
  const actualDecorator = Reflect.metadata(ADMIN_ROLE_KEY, role);
  return actualDecorator(target, key, descriptor);
};

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has admin privileges
    // For now, we'll check if user has admin role in any space
    // In production, you might want to have a separate admin flag on the User model
    const adminSpaces = await this.prisma.userSpace.findMany({
      where: {
        userId: user.id,
        role: 'admin',
      },
      include: {
        space: true,
      },
    });

    // Also check if user owns any space (owners have implicit admin rights)
    const ownedSpaces = await this.prisma.userSpace.findMany({
      where: {
        userId: user.id,
        role: 'owner',
      },
      include: {
        space: true,
      },
    });

    const isAdmin = adminSpaces.length > 0 || ownedSpaces.length > 0;

    if (!isAdmin) {
      this.logger.warn(`Non-admin user ${user.id} attempted to access admin endpoint`, {
        userId: user.id,
        email: user.email,
        path: request.path,
      });
      throw new ForbiddenException('Admin access required');
    }

    // Log admin access for audit trail
    this.logger.info(`Admin access granted to user ${user.id}`, {
      userId: user.id,
      email: user.email,
      path: request.path,
      method: request.method,
    });

    return true;
  }
}