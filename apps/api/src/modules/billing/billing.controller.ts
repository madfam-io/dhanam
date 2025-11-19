import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Headers,
  RawBodyRequest,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { UpgradeToPremiumDto } from './dto';

@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private billingService: BillingService,
    private stripeService: StripeService,
    private config: ConfigService
  ) {}

  /**
   * Initiate upgrade to premium subscription
   */
  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  async upgradeToPremium(@Req() req: any, @Body() dto: UpgradeToPremiumDto) {
    return this.billingService.upgradeToPremium(req.user.id);
  }

  /**
   * Create billing portal session for subscription management
   */
  @Post('portal')
  @UseGuards(JwtAuthGuard)
  async createPortalSession(@Req() req: any) {
    return this.billingService.createPortalSession(req.user.id);
  }

  /**
   * Get current usage metrics for the authenticated user
   */
  @Get('usage')
  @UseGuards(JwtAuthGuard)
  async getUsage(@Req() req: any) {
    return this.billingService.getUserUsage(req.user.id);
  }

  /**
   * Get billing history for the authenticated user
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getBillingHistory(@Req() req: any) {
    return this.billingService.getBillingHistory(req.user.id);
  }

  /**
   * Get subscription status for the authenticated user
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getSubscriptionStatus(@Req() req: any) {
    const user = req.user;

    return {
      tier: user.subscriptionTier,
      startedAt: user.subscriptionStartedAt,
      expiresAt: user.subscriptionExpiresAt,
      isActive: user.subscriptionTier === 'premium' &&
                (!user.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) > new Date()),
    };
  }

  /**
   * Stripe webhook handler
   * This endpoint receives events from Stripe and processes them
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
      return { received: false, error: 'Webhook secret not configured' };
    }

    let event: any;

    try {
      // Verify webhook signature
      event = this.stripeService.constructWebhookEvent(
        req.rawBody || req.body,
        signature,
        webhookSecret
      );
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      return { received: false, error: 'Invalid signature' };
    }

    this.logger.log(`Received Stripe webhook: ${event.type}`);

    try {
      // Handle different event types
      switch (event.type) {
        case 'customer.subscription.created':
          await this.billingService.handleSubscriptionCreated(event);
          break;

        case 'customer.subscription.updated':
          await this.billingService.handleSubscriptionUpdated(event);
          break;

        case 'customer.subscription.deleted':
          await this.billingService.handleSubscriptionCancelled(event);
          break;

        case 'invoice.payment_succeeded':
          await this.billingService.handlePaymentSucceeded(event);
          break;

        case 'invoice.payment_failed':
          await this.billingService.handlePaymentFailed(event);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      return { received: false, error: error.message };
    }

    return { received: true };
  }
}
