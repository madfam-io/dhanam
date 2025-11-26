import { IsString, IsObject, IsOptional, IsEnum } from 'class-validator';

export enum JanuaWebhookEventType {
  // Subscription events
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  SUBSCRIPTION_PAUSED = 'subscription.paused',
  SUBSCRIPTION_RESUMED = 'subscription.resumed',
  SUBSCRIPTION_EXPIRED = 'subscription.expired',

  // Payment events
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  // Customer events
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
}

export class JanuaWebhookPayloadDto {
  @IsString()
  id: string;

  @IsEnum(JanuaWebhookEventType)
  type: JanuaWebhookEventType;

  @IsString()
  timestamp: string;

  @IsObject()
  data: {
    customer_id?: string;
    subscription_id?: string;
    plan_id?: string;
    status?: string;
    amount?: number;
    currency?: string;
    provider?: 'conekta' | 'polar' | 'stripe';
    metadata?: Record<string, any>;
  };

  @IsString()
  @IsOptional()
  source_app?: string;
}
