import { SetMetadata } from '@nestjs/common';
import { SpaceRole } from '@dhanam/shared';

export const ROLES_KEY = 'roles';
export const RequireRole = (...roles: SpaceRole[]) => SetMetadata(ROLES_KEY, roles);