import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SpacesService } from '../spaces.service';
import { ROLES_KEY } from '../decorators/require-role.decorator';
import { SpaceRole } from '@dhanam/shared';

@Injectable()
export class SpaceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private spacesService: SpacesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const spaceId = request.params.spaceId;

    if (!user || !spaceId) {
      throw new ForbiddenException('Access denied');
    }

    const userRole = await this.spacesService.getUserRoleInSpace(user.id, spaceId);

    if (!userRole) {
      throw new ForbiddenException('Not a member of this space');
    }

    // Check required roles if specified
    const requiredRoles = this.reflector.getAllAndOverride<SpaceRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && !requiredRoles.includes(userRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Attach space role to request
    request.spaceRole = userRole;

    return true;
  }
}