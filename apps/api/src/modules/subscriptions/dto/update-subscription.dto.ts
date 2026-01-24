import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

import { Currency, RecurrenceFrequency, SubscriptionCategory, SubscriptionStatus } from '@db';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ description: 'Name of the subscription service' })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({ description: 'URL to the service' })
  @IsOptional()
  @IsUrl()
  serviceUrl?: string;

  @ApiPropertyOptional({ description: 'Icon URL for the service' })
  @IsOptional()
  @IsString()
  serviceIcon?: string;

  @ApiPropertyOptional({ enum: SubscriptionCategory })
  @IsOptional()
  @IsEnum(SubscriptionCategory)
  category?: SubscriptionCategory;

  @ApiPropertyOptional({ description: 'Description of the subscription' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Subscription amount per billing cycle' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ enum: RecurrenceFrequency })
  @IsOptional()
  @IsEnum(RecurrenceFrequency)
  billingCycle?: RecurrenceFrequency;

  @ApiPropertyOptional({ description: 'Next billing date (ISO string)' })
  @IsOptional()
  @IsDateString()
  nextBillingDate?: string;

  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ description: 'Trial end date (ISO string)' })
  @IsOptional()
  @IsDateString()
  trialEndDate?: string;

  @ApiPropertyOptional({ description: 'Days before billing to send alert' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  @Type(() => Number)
  alertBeforeDays?: number;

  @ApiPropertyOptional({ description: 'Whether to send alerts' })
  @IsOptional()
  @IsBoolean()
  alertEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Usage frequency: low, medium, high' })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'unknown'])
  usageFrequency?: string;
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional({ description: 'Reason for cancellation' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'End date for the subscription (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
