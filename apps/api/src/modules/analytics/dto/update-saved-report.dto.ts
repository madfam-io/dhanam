import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';

import { ReportFormat } from '@db';

export class UpdateSavedReportDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  schedule?: string;

  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat;

  @IsOptional()
  filters?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
