import { AssetType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, Max } from 'class-validator';

export class UpdateBeneficiaryDto {
  @IsEnum(AssetType)
  @IsOptional()
  assetType?: AssetType;

  @IsUUID()
  @IsOptional()
  assetId?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  percentage?: number;

  @IsOptional()
  conditions?: any;

  @IsString()
  @IsOptional()
  notes?: string;
}
