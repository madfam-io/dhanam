import { IsString, IsEnum, IsOptional } from 'class-validator';
import { HouseholdType, Currency } from '@prisma/client';

export class UpdateHouseholdDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(HouseholdType)
  @IsOptional()
  type?: HouseholdType;

  @IsEnum(Currency)
  @IsOptional()
  baseCurrency?: Currency;

  @IsString()
  @IsOptional()
  description?: string;
}
