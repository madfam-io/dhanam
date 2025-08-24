import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsEnum } from 'class-validator';

export enum BelvoWebhookEvent {
  ACCOUNTS_CREATED = 'accounts_created',
  TRANSACTIONS_CREATED = 'transactions_created',
  LINK_CREATED = 'link_created',
  LINK_FAILED = 'link_failed',
}

export class BelvoWebhookDto {
  @ApiProperty({ enum: BelvoWebhookEvent })
  @IsEnum(BelvoWebhookEvent)
  event: BelvoWebhookEvent;

  @ApiProperty()
  @IsString()
  link_id: string;

  @ApiProperty()
  @IsObject()
  data: Record<string, any>;
}
