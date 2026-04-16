import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * Payload for the `referral.converted` webhook from PhyneCRM.
 * Received via HMAC-authenticated POST /v1/referral/reward.
 */
export class ReferralConversionWebhookDto {
  @ApiProperty({ description: 'Event type', example: 'referral.converted' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Conversion data payload' })
  data: ReferralConversionDataDto;
}

export class ReferralConversionDataDto {
  @ApiProperty({ description: 'The referral code used', example: 'MADFAM-A1B2C3D4' })
  @IsString()
  referral_code: string;

  @ApiProperty({ description: 'User ID of the referrer' })
  @IsString()
  referrer_user_id: string;

  @ApiProperty({ description: 'User ID of the referred user' })
  @IsString()
  referred_user_id: string;

  @ApiProperty({ description: 'Product where the referral originated', example: 'dhanam' })
  @IsString()
  source_product: string;

  @ApiProperty({ description: 'Product the referred user signed up for', example: 'karafiel' })
  @IsString()
  target_product: string;

  @ApiProperty({ description: 'Plan ID of the subscription', required: false })
  @IsOptional()
  @IsString()
  plan_id?: string;

  @ApiProperty({ description: 'Revenue in cents', required: false })
  @IsOptional()
  @IsNumber()
  revenue_cents?: number;
}
