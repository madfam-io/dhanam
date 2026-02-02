import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsUrl, IsUUID } from 'class-validator';

const VALID_PLANS = ['essentials', 'pro', 'essentials_yearly', 'pro_yearly'] as const;

export class CheckoutQueryDto {
  @ApiProperty({ enum: VALID_PLANS, description: 'Subscription plan' })
  @IsIn(VALID_PLANS)
  plan: (typeof VALID_PLANS)[number];

  @ApiProperty({ description: 'Janua user ID' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ description: 'URL to redirect after checkout' })
  @IsString()
  @IsUrl({ require_tld: false }, { message: 'return_url must be a valid URL' })
  return_url: string;
}
