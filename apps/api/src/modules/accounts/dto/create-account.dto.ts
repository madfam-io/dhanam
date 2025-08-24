import { IsString, IsNumber, IsIn, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType, Currency } from '@dhanam/shared';

export class CreateAccountDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['checking', 'savings', 'credit', 'investment', 'crypto', 'other'] })
  @IsIn(['checking', 'savings', 'credit', 'investment', 'crypto', 'other'])
  type: AccountType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtype?: string;

  @ApiProperty({ enum: ['MXN', 'USD', 'EUR'] })
  @IsIn(['MXN', 'USD', 'EUR'])
  currency: Currency;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  balance: number;
}