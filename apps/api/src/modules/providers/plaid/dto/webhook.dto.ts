import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, IsEnum } from 'class-validator';

enum PlaidWebhookType {
  TRANSACTIONS = 'TRANSACTIONS',
  ACCOUNTS = 'ACCOUNTS',
  ITEM = 'ITEM',
  AUTH = 'AUTH',
  IDENTITY = 'IDENTITY',
  INVESTMENTS = 'INVESTMENTS',
  LIABILITIES = 'LIABILITIES',
  ASSETS = 'ASSETS',
}

enum PlaidWebhookCode {
  // TRANSACTIONS
  SYNC_UPDATES_AVAILABLE = 'SYNC_UPDATES_AVAILABLE',
  DEFAULT_UPDATE = 'DEFAULT_UPDATE',
  INITIAL_UPDATE = 'INITIAL_UPDATE',
  HISTORICAL_UPDATE = 'HISTORICAL_UPDATE',
  TRANSACTIONS_REMOVED = 'TRANSACTIONS_REMOVED',

  // ACCOUNTS
  DEFAULT_UPDATE_ACCOUNTS = 'DEFAULT_UPDATE_ACCOUNTS',

  // ITEM
  ERROR = 'ERROR',
  NEW_ACCOUNTS_AVAILABLE = 'NEW_ACCOUNTS_AVAILABLE',
  PENDING_EXPIRATION = 'PENDING_EXPIRATION',
  USER_PERMISSION_REVOKED = 'USER_PERMISSION_REVOKED',
  WEBHOOK_UPDATE_ACKNOWLEDGED = 'WEBHOOK_UPDATE_ACKNOWLEDGED',
}

export class PlaidWebhookDto {
  @ApiProperty({ description: 'Webhook type', enum: PlaidWebhookType })
  @IsEnum(PlaidWebhookType)
  webhook_type: PlaidWebhookType;

  @ApiProperty({ description: 'Webhook code', enum: PlaidWebhookCode })
  @IsEnum(PlaidWebhookCode)
  webhook_code: PlaidWebhookCode;

  @ApiProperty({ description: 'Item ID' })
  @IsString()
  item_id: string;

  @ApiProperty({ description: 'Environment' })
  @IsString()
  environment: string;

  @ApiProperty({ description: 'Error details', required: false })
  @IsObject()
  @IsOptional()
  error?: {
    error_type: string;
    error_code: string;
    error_message: string;
    display_message?: string;
  };

  @ApiProperty({ description: 'Number of new transactions', required: false })
  @IsOptional()
  new_transactions?: number;

  @ApiProperty({ description: 'Removed transaction IDs', required: false })
  @IsOptional()
  removed_transactions?: string[];
}
