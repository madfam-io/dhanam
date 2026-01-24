import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsUrl,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

import { Currency, RecurrenceFrequency, SubscriptionCategory, SubscriptionStatus } from '@db';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Name of the subscription service' })
  @IsString()
  serviceName: string;

  @ApiPropertyOptional({ description: 'URL to the service' })
  @IsOptional()
  @IsUrl()
  serviceUrl?: string;

  @ApiPropertyOptional({ description: 'Icon URL for the service' })
  @IsOptional()
  @IsString()
  serviceIcon?: string;

  @ApiPropertyOptional({ enum: SubscriptionCategory, default: 'other' })
  @IsOptional()
  @IsEnum(SubscriptionCategory)
  category?: SubscriptionCategory;

  @ApiPropertyOptional({ description: 'Description of the subscription' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Subscription amount per billing cycle' })
  @IsNumber()
  @Type(() => Number)
  amount: number;

  @ApiProperty({ enum: Currency })
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({ enum: RecurrenceFrequency })
  @IsEnum(RecurrenceFrequency)
  billingCycle: RecurrenceFrequency;

  @ApiPropertyOptional({ description: 'Next billing date (ISO string)' })
  @IsOptional()
  @IsDateString()
  nextBillingDate?: string;

  @ApiPropertyOptional({ enum: SubscriptionStatus, default: 'active' })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiProperty({ description: 'Subscription start date (ISO string)' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Trial end date (ISO string)' })
  @IsOptional()
  @IsDateString()
  trialEndDate?: string;

  @ApiPropertyOptional({ description: 'Link to a detected recurring pattern' })
  @IsOptional()
  @IsUUID()
  recurringId?: string;

  @ApiPropertyOptional({ description: 'Days before billing to send alert', default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  @Type(() => Number)
  alertBeforeDays?: number;

  @ApiPropertyOptional({ description: 'Whether to send alerts', default: true })
  @IsOptional()
  @IsBoolean()
  alertEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
