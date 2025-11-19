import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';

export enum OrderStatus {
  pending_verification = 'pending_verification',
  pending_execution = 'pending_execution',
  executing = 'executing',
  completed = 'completed',
  failed = 'failed',
  cancelled = 'cancelled',
  rejected = 'rejected',
}

export class OrderFilterDto {
  @IsString()
  @IsOptional()
  accountId?: string;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsString()
  @IsOptional()
  goalId?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
