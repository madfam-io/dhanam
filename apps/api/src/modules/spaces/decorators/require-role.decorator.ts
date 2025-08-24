import { SpaceRole } from '@dhanam/shared';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const RequireRole = (...roles: SpaceRole[]) => SetMetadata(ROLES_KEY, roles);
