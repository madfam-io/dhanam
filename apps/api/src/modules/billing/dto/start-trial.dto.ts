import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class StartTrialDto {
  @ApiProperty({
    description: 'The plan to trial',
    enum: ['essentials', 'pro', 'premium'],
  })
  @IsString()
  @IsIn(['essentials', 'pro', 'premium'])
  plan: string;
}
