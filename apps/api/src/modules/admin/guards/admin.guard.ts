import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

import { LoggerService } from '@core/logger/logger.service';
import { PrismaService } from '@core/prisma/prisma.service';

export const ADMIN_ROLE_KEY = 'adminRole';
export const AdminRole = (role?: string) => 
  Reflect.metadata(ADMIN_ROLE_KEY, role);

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService
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
      this.logger.warn(
        `Non-admin user ${user.id} attempted to access admin endpoint`,
        'AdminGuard'
      );
      throw new ForbiddenException('Admin access required');
    }

    // Log admin access for audit trail
    this.logger.log(`Admin access granted to user ${user.id}`, 'AdminGuard');

    return true;
  }
}
