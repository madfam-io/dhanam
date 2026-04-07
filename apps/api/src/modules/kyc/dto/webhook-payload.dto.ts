import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * MetaMap webhook event types relevant to identity verification.
 * See: https://docs.metamap.com/reference/webhooks
 */
const METAMAP_EVENT_TYPES = [
  'verification_started',
  'verification_inputs_completed',
  'verification_completed',
  'verification_updated',
  'verification_expired',
] as const;

export type MetaMapEventType = (typeof METAMAP_EVENT_TYPES)[number];

export class MetaMapWebhookPayloadDto {
  @ApiProperty({
    description: 'MetaMap event type',
    enum: METAMAP_EVENT_TYPES,
  })
  @IsString()
  @IsIn(METAMAP_EVENT_TYPES)
  eventName: MetaMapEventType;

  @ApiProperty({ description: 'MetaMap flow run ID' })
  @IsString()
  flowId: string;

  @ApiPropertyOptional({ description: 'Timestamp of the event' })
  @IsOptional()
  @IsString()
  timestamp?: string;

  @ApiPropertyOptional({ description: 'Verification status returned by MetaMap' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Whether the identity matched a PEP list' })
  @IsOptional()
  @IsBoolean()
  pepMatch?: boolean;

  @ApiPropertyOptional({ description: 'Whether the identity matched a sanctions list' })
  @IsOptional()
  @IsBoolean()
  sanctionsMatch?: boolean;

  @ApiPropertyOptional({ description: 'Whether CURP was validated successfully' })
  @IsOptional()
  @IsBoolean()
  curpValidated?: boolean;

  @ApiPropertyOptional({ description: 'Whether INE was validated successfully' })
  @IsOptional()
  @IsBoolean()
  ineValidated?: boolean;

  @ApiPropertyOptional({ description: 'Additional verification data from MetaMap' })
  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Metadata originally sent during flow creation (contains userId)',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
