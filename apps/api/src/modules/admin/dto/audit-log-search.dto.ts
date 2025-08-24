import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from './pagination.dto';

export enum AuditLogSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class AuditLogSearchDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by action' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Filter by resource type' })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiPropertyOptional({ description: 'Filter by resource ID' })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({ enum: AuditLogSeverity, description: 'Filter by severity' })
  @IsOptional()
  @IsEnum(AuditLogSeverity)
  severity?: AuditLogSeverity;

  @ApiPropertyOptional({ description: 'Filter by IP address' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Filter logs after this timestamp' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter logs before this timestamp' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}