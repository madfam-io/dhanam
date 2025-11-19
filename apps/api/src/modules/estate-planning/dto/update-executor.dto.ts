import { IsBoolean, IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateExecutorDto {
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
