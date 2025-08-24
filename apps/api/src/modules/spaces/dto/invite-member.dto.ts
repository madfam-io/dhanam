import { SpaceRole } from '@dhanam/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ['admin', 'member', 'viewer'] })
  @IsIn(['admin', 'member', 'viewer'])
  role: Exclude<SpaceRole, 'owner'>;
}
