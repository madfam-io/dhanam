import { IsString, IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@dhanam/shared';

export class UpdateSpaceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ['MXN', 'USD', 'EUR'] })
  @IsOptional()
  @IsIn(['MXN', 'USD', 'EUR'])
  currency?: Currency;
}