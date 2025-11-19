import { IsUUID, IsNotEmpty, IsBoolean, IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddExecutorDto {
  @IsUUID()
  @IsNotEmpty()
  executorId: string; // HouseholdMember ID

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
