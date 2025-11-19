import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';

export class UpdateOrderDto {
  @IsNumber()
  @IsOptional()
  @Min(0.01)
  amount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  targetPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  maxSlippage?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  metadata?: any;
}
