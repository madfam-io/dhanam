import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateShareTokenDto {
  @IsInt()
  @Min(1)
  @Max(720) // 30 days max
  @IsOptional()
  @Type(() => Number)
  expiresInHours?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  maxAccess?: number;

  @IsString()
  @IsOptional()
  generatedReportId?: string;
}
