import { IsUUID, IsNumber, Min, Max, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AddAllocationDto {
  @IsUUID()
  accountId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  percentage: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
