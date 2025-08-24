import { IsEmail, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SpaceRole } from '@dhanam/shared';

export class InviteMemberDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ['admin', 'member', 'viewer'] })
  @IsIn(['admin', 'member', 'viewer'])
  role: Exclude<SpaceRole, 'owner'>;
}