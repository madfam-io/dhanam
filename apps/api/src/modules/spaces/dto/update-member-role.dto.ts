import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SpaceRole } from '@dhanam/shared';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ['owner', 'admin', 'member', 'viewer'] })
  @IsIn(['owner', 'admin', 'member', 'viewer'])
  role: SpaceRole;
}