import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Min } from 'class-validator';

export class RecordUsageDto {
  @ApiProperty({ description: 'Organization ID consuming the credits' })
  @IsUUID()
  orgId: string;

  @ApiProperty({ description: 'Service reporting usage (e.g. "karafiel", "selva", "fortuna")' })
  @IsString()
  service: string;

  @ApiProperty({ description: 'Operation type (e.g. "cfdi_stamp", "agent_dispatch")' })
  @IsString()
  operation: string;

  @ApiProperty({ description: 'Number of credits consumed', minimum: 1 })
  @IsInt()
  @Min(1)
  credits: number;

  @ApiProperty({ description: 'Idempotency key to prevent double-counting' })
  @IsString()
  idempotencyKey: string;
}

export class UsageQueryDto {
  @ApiProperty({ required: false, description: 'Start date for usage query (ISO 8601)' })
  start?: string;

  @ApiProperty({ required: false, description: 'End date for usage query (ISO 8601)' })
  end?: string;

  @ApiProperty({ required: false, description: 'Filter by service name' })
  service?: string;
}
