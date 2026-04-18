/**
 * =============================================================================
 * Stripe Mexico Controller (T1.1 — MXN flywheel roadmap)
 * =============================================================================
 *
 * Dedicated endpoints for the Mexico payment path, scoped so the legacy
 * `BillingController` doesn't have to know about SPEI / customer_balance
 * mechanics.
 *
 * ## Endpoints
 *
 * - `POST /v1/billing/stripe-mx/spei-payment-intent`
 *   Create an MXN PaymentIntent funded via SPEI bank transfer
 *   (Stripe `customer_balance` payment method). Auth-required.
 *
 * - `POST /v1/billing/webhooks/stripe`
 *   Stripe webhook receiver for MX-relevant events (payment_intent.*,
 *   charge.refunded). Signature verified, feature-flagged, idempotent
 *   on Stripe event id. Relays into Dhanam's canonical outbound
 *   payment envelope via `StripeMxSpeiRelayService`.
 *   THIS IS THE URL REGISTERED IN THE STRIPE DASHBOARD.
 *
 * =============================================================================
 */

import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type Stripe from 'stripe';

import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../core/types/authenticated-request';

import { CreateSpeiPaymentIntentDto } from './dto/create-spei-payment-intent.dto';
import { StripeMxSpeiRelayService } from './services/stripe-mx-spei-relay.service';
import { StripeMxService } from './services/stripe-mx.service';

interface SpeiPaymentIntentResponse {
  paymentIntentId: string;
  status: string;
  amount: number;
  amountMinor: number;
  currency: 'MXN';
  paymentRequestId: string;
  hostedInstructionsUrl?: string;
  bankTransfer?: {
    type: string;
    clabe?: string;
    reference?: string;
    bankName?: string;
    accountHolderName?: string;
  };
  expiresAt?: string;
}

@ApiTags('Billing — Stripe MX (T1.1)')
@Controller('billing')
export class StripeMxController {
  private readonly logger = new Logger(StripeMxController.name);

  constructor(
    private readonly stripeMx: StripeMxService,
    private readonly relay: StripeMxSpeiRelayService,
    private readonly config: ConfigService
  ) {}

  /**
   * Create an MXN PaymentIntent backed by SPEI bank transfer.
   *
   * Response surfaces the CLABE + reference code so the client can
   * render bank-transfer instructions without round-tripping Stripe's
   * hosted page (though we ALSO return the hosted URL for clients
   * that prefer to delegate).
   */
  @Post('stripe-mx/spei-payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Create an MXN PaymentIntent via SPEI (customer_balance). Idempotent on paymentRequestId.',
  })
  @ApiCreatedResponse({
    description: 'PaymentIntent created with SPEI bank transfer instructions.',
  })
  @ApiBadRequestResponse({ description: 'Validation failed or Stripe MX not configured.' })
  async createSpeiPaymentIntent(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSpeiPaymentIntentDto
  ): Promise<SpeiPaymentIntentResponse> {
    if (!this.stripeMx.isConfigured()) {
      throw new BadRequestException('Stripe MX is not configured on this environment');
    }

    const metadata: Record<string, string> = {
      dhanam_user_id: req.user.id,
      ...(dto.metadata ?? {}),
    };

    const pi = await this.stripeMx.createSpeiPaymentIntent({
      amount: dto.amount,
      currency: dto.currency || 'mxn',
      customerId: dto.customerId,
      customerEmail: dto.customerEmail,
      description: dto.description,
      paymentRequestId: dto.paymentRequestId,
      metadata,
    });

    const nextAction = pi.next_action as Stripe.PaymentIntent.NextAction | null | undefined;
    const bankTransfer = nextAction?.display_bank_transfer_instructions;
    const financialAddr = bankTransfer?.financial_addresses?.[0];
    const speiAddr = (financialAddr as any)?.spei as
      | { clabe?: string; bank_name?: string; bank_code?: string }
      | undefined;

    const response: SpeiPaymentIntentResponse = {
      paymentIntentId: pi.id,
      status: pi.status,
      amount: (pi.amount ?? 0) / 100,
      amountMinor: pi.amount ?? 0,
      currency: 'MXN',
      paymentRequestId: dto.paymentRequestId,
      hostedInstructionsUrl: bankTransfer?.hosted_instructions_url || undefined,
      bankTransfer: bankTransfer
        ? {
            type: bankTransfer.type || 'mx_bank_transfer',
            clabe: speiAddr?.clabe,
            reference: bankTransfer.reference || undefined,
            bankName: speiAddr?.bank_name,
            accountHolderName: (financialAddr as any)?.account_holder_name,
          }
        : undefined,
      expiresAt: (bankTransfer as any)?.hosted_instructions_url_expires_at
        ? new Date(
            ((bankTransfer as any).hosted_instructions_url_expires_at as number) * 1000
          ).toISOString()
        : undefined,
    };

    this.logger.log(
      `Created SPEI PaymentIntent ${pi.id} (${dto.amount} centavos) for user ${req.user.id}`
    );
    return response;
  }

  /**
   * Stripe webhook receiver for Mexico payment events.
   *
   * Stripe signs webhooks with STRIPE_MX_WEBHOOK_SECRET. Signature
   * verification happens here BEFORE the event touches the relay;
   * an invalid signature returns 400 so Stripe knows to retry.
   *
   * We delegate ALL payment_intent.* and charge.refunded events to
   * `StripeMxSpeiRelayService`. Subscription/invoice events are
   * ignored here — the existing `/billing/webhook` endpoint still
   * owns that path.
   */
  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Stripe MX webhook receiver (payment_intent.*, charge.refunded). Signature-verified, idempotent.',
  })
  @ApiOkResponse({ description: 'Webhook accepted (ACK is independent of relay outcome).' })
  @ApiBadRequestResponse({ description: 'Invalid Stripe signature or missing webhook config.' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ): Promise<{ received: true; relayed: boolean; eventType?: string }> {
    if (!signature) {
      this.logger.warn('Stripe webhook rejected: missing stripe-signature header');
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!this.stripeMx.isConfigured()) {
      this.logger.error('Stripe webhook rejected: Stripe MX not configured');
      throw new BadRequestException('Stripe MX not configured');
    }

    const rawBody = (req.rawBody ?? (req as any).body) as Buffer | string;

    let event: Stripe.Event;
    try {
      event = this.stripeMx.verifyWebhookSignature(rawBody, signature);
    } catch (err) {
      this.logger.warn(`Stripe webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException('Invalid Stripe signature');
    }

    this.logger.log(
      `Stripe webhook received: type=${event.type} id=${event.id} livemode=${event.livemode}`
    );

    let relayed = false;
    try {
      relayed = await this.relay.relay(event);
    } catch (err) {
      // Relay errors MUST NOT 500 back to Stripe — that would amplify
      // retries into a thundering herd. Log + ACK 200; our own
      // dead-letter/Sentry surfaces the failure.
      this.logger.error(`Relay failure for stripe event ${event.id}: ${(err as Error).message}`);
    }

    return { received: true, relayed, eventType: event.type };
  }
}
