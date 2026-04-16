import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateCodeDto {
  @ApiProperty({
    description: 'Source product generating the referral',
    enum: ['karafiel', 'dhanam', 'selva', 'fortuna', 'tezca', 'janua'],
    example: 'dhanam',
  })
  @IsString()
  @IsIn(['karafiel', 'dhanam', 'selva', 'fortuna', 'tezca', 'janua'])
  sourceProduct: string;

  @ApiProperty({
    description: 'Target product the code is restricted to (null = any)',
    required: false,
    example: 'karafiel',
  })
  @IsOptional()
  @IsString()
  targetProduct?: string;
}
