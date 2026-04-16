import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class ReferralEventDto {
  @ApiProperty({
    description: 'Lifecycle event type',
    enum: ['click', 'signup', 'trial_started', 'converted'],
    example: 'converted',
  })
  @IsString()
  @IsIn(['click', 'signup', 'trial_started', 'converted'])
  event: 'click' | 'signup' | 'trial_started' | 'converted';

  @ApiProperty({ description: 'The referral code', example: 'MADFAM-A1B2C3D4' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Email of the referred user', example: 'user@example.com' })
  @IsEmail()
  referredEmail: string;

  @ApiProperty({ description: 'User ID of the referred user (if known)', required: false })
  @IsOptional()
  @IsUUID()
  referredUserId?: string;

  @ApiProperty({ description: 'Product where the event occurred', example: 'dhanam' })
  @IsString()
  targetProduct: string;

  @ApiProperty({ description: 'Subscription ID for conversion events', required: false })
  @IsOptional()
  @IsString()
  subscriptionId?: string;
}
