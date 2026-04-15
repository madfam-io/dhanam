import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class PauseSubscriptionDto {
  @IsOptional()
  @IsUUID()
  intentId?: string;

  @IsInt()
  @Min(1)
  @Max(3)
  months: number;
}
