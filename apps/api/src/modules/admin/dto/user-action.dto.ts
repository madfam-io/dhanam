import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UserActionDto {
  @ApiProperty({ description: 'Reason for the action (recorded in audit trail)' })
  @IsString()
  @MinLength(1)
  reason: string;
}
