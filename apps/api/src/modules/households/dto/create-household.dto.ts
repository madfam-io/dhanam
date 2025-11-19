import { HouseholdType, Currency } from '@prisma/client';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class CreateHouseholdDto {
  @IsString()
  @IsNotEmpty()
  name: string;

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
