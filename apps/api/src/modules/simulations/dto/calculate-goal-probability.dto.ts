import { IsNumber, IsUUID, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CalculateGoalProbabilityDto {
  @IsUUID()
  goalId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  currentValue: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  targetAmount: number;

  @IsNumber()
  @Min(1)
  @Max(1200)
  @Type(() => Number)
  monthsRemaining: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  monthlyContribution: number;

  @IsNumber()
  @Min(-0.50)
  @Max(0.50)
  @Type(() => Number)
  expectedReturn: number;

  @IsNumber()
  @Min(0)
  @Max(1.0)
  @Type(() => Number)
  volatility: number;

  @IsNumber()
  @Min(100)
  @Max(50000)
  @IsOptional()
  @Type(() => Number)
  iterations?: number;
}
