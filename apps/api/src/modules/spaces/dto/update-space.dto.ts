import { Currency } from '@dhanam/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional } from 'class-validator';

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
