import { HouseholdType, Currency } from '@prisma/client';
import { IsString, IsEnum, IsOptional } from 'class-validator';

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
