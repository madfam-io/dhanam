import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsObject } from 'class-validator';

enum BitsoWebhookType {
  DEPOSITS = 'deposits',
  WITHDRAWALS = 'withdrawals',
  TRADES = 'trades',
  ORDERS = 'orders',
}

enum BitsoWebhookStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export class BitsoWebhookDto {
  @ApiProperty({ description: 'Webhook type', enum: BitsoWebhookType })
  @IsEnum(BitsoWebhookType)
  type: BitsoWebhookType;

  @ApiProperty({ description: 'Transaction ID' })
  @IsString()
  tid: string;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  user: string;

  @ApiProperty({ description: 'Amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Currency' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Transaction status', enum: BitsoWebhookStatus })
  @IsEnum(BitsoWebhookStatus)
  status: BitsoWebhookStatus;

  @ApiProperty({ description: 'Timestamp' })
  @IsString()
  timestamp: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}
