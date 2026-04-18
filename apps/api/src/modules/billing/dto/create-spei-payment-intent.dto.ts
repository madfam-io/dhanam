import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';

/**
 * Request body for POST /v1/billing/stripe-mx/spei-payment-intent.
 *
 * Shipped with T1.1 (MXN flywheel roadmap) to create a Stripe MX
 * PaymentIntent configured for SPEI bank transfers via the
 * `customer_balance` payment method.
 */
export class CreateSpeiPaymentIntentDto {
  @ApiProperty({
    description: 'Amount in MXN centavos (minor units). 1 MXN = 100 centavos.',
    example: 19900,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  // Stripe caps at 99,999,999 minor units (~999,999.99 MXN). We enforce
  // the same ceiling so the server-side request fails fast.
  @Max(99_999_999)
  amount: number;

  @ApiPropertyOptional({
    description: 'ISO currency code. MUST be MXN — SPEI is MXN-only.',
    default: 'MXN',
    example: 'MXN',
  })
  @IsOptional()
  @IsString()
  @IsIn(['MXN', 'mxn'])
  currency?: string;

  @ApiProperty({
    description:
      'Stable idempotency key for this payment request, generated client-side. Stripe retains idempotency keys for 24h.',
    example: 'dhanam-pi-user123-inv456',
  })
  @IsString()
  @Length(8, 128)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'paymentRequestId must be alphanumeric (plus _ and -)',
  })
  paymentRequestId: string;

  @ApiProperty({ description: 'Customer email for Stripe receipt.', example: 'user@example.com' })
  @IsString()
  customerEmail: string;

  @ApiPropertyOptional({ description: 'Stripe customer id (if already federated).' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ description: 'Human-readable description (shows on Stripe + email receipt).' })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description:
      'Extra metadata attached to the PaymentIntent (e.g., dhanam_user_id, subscription_id).',
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  @IsOptional()
  metadata?: Record<string, string>;
}
