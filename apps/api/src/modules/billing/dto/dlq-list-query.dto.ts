import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Query params for `GET /v1/billing/dlq`. All optional.
 */
export class DlqListQueryDto {
  /** Filter by consumer key (e.g. `karafiel`). */
  @IsOptional()
  @IsString()
  consumer?: string;

  /** ISO timestamp; only failures created at or after this are returned. */
  @IsOptional()
  @IsDateString()
  since?: string;

  /** Include resolved rows (default false — DLQ view is unresolved-only). */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeResolved?: boolean;

  /** Page size (default 50, max 200). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  /** Page offset (default 0). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
