import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Body for `POST /v1/billing/dlq/:id/resolve`. Operator records why
 * they're closing the row out-of-band so the audit trail captures it.
 */
export class DlqResolveDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
