import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum AssetType {
  CRYPTO = 'crypto',
  EQUITY = 'equity',
  ETF = 'etf',
  COMMODITY = 'commodity',
}

export class EsgScoreDto {
  @ApiProperty({ description: 'Asset symbol (e.g., BTC, ETH)' })
  @IsString()
  symbol: string;

  @ApiProperty({ description: 'Asset type', enum: AssetType })
  @IsEnum(AssetType)
  assetType: AssetType;

  @ApiProperty({ description: 'Environmental score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  environmentalScore: number;

  @ApiProperty({ description: 'Social score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  socialScore: number;

  @ApiProperty({ description: 'Governance score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  governanceScore: number;

  @ApiProperty({ description: 'Overall ESG score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  overallScore: number;

  @ApiProperty({ description: 'ESG grade (A+ to D-)', required: false })
  @IsString()
  @IsOptional()
  grade?: string;

  @ApiProperty({ description: 'Energy intensity (kWh per transaction)', required: false })
  @IsNumber()
  @IsOptional()
  energyIntensity?: number;

  @ApiProperty({ description: 'Carbon footprint (kg CO2 per transaction)', required: false })
  @IsNumber()
  @IsOptional()
  carbonFootprint?: number;
}