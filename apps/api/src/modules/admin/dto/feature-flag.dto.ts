import { IsString, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeatureFlagDto {
  @ApiProperty({ description: 'Feature flag key' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Feature flag name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Feature flag description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Is feature enabled globally' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Percentage rollout (0-100)' })
  @IsOptional()
  percentageRollout?: number;

  @ApiPropertyOptional({ description: 'User IDs allowed to access this feature' })
  @IsOptional()
  allowedUserIds?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateFeatureFlagDto {
  @ApiPropertyOptional({ description: 'Is feature enabled globally' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Percentage rollout (0-100)' })
  @IsOptional()
  percentageRollout?: number;

  @ApiPropertyOptional({ description: 'User IDs allowed to access this feature' })
  @IsOptional()
  allowedUserIds?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}