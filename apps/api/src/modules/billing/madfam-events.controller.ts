import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  RawBodyRequest,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { Prisma } from '@db';

import { AuditService } from '../../core/audit/audit.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PostHogService } from '../analytics/posthog.service';

import { verifyMadfamSignature } from './madfam-events.sig';

/**
 * Receiver for signed MADFAM ecosystem events.
 *
 * Counterpart to `@routecraft/payments`'s `emitPaymentSucceeded()`. Every
 * MADFAM platform that takes money fires an event at this endpoint so
 * Dhanam (the ecosystem ledger) has a durable record of the MXN ingress.
 *
 * Signature contract (matches the probe + zavlo MercadoPago shape):
 *   - Header: `x-madfam-signature: t=<unix-seconds>,v1=<hex-hmac-sha256>`
 *   - HMAC input: `"${ts}.${raw-body}"`
 *   - Secret: env var `MADFAM_EVENTS_WEBHOOK_SECRET`
 *   - Replay window: 5 minutes (rejects stale `ts`).
 *
 * Idempotency: every event carries a stable `event_id` that we persist
 * on `BillingEvent.stripeEventId` (field is `@unique`). Repeat posts of
 * the same event return 200 with `status: "duplicate"` so the upstream
 * emitter's retry path is safe.
 *
 * Probe path: `GET /v1/probe/billing-events/:eventId` mirrors the probe
 * step at `autoswarm-office/packages/revenue-loop-probe/.../dhanam_billing.py`.
 */

interface EcosystemEventAttribution {
  source_agent_id?: string;
  campaign_id?: string;
  referral_code?: string;
  first_touch_at?: string;
}

interface EcosystemPaymentSucceededEvent {
  schema_version: '1';
  event_id: string;
  provider: 'conekta' | 'stripe' | 'fungies' | 'mercadopago' | string;
  subscription_id: string;
  organization_id: string;
  amount_minor: number;
  currency: 'MXN' | 'USD' | 'EUR' | 'CAD' | string;
  occurred_at: string;
  attribution?: EcosystemEventAttribution;
  metadata?: Record<string, unknown>;
}

@ApiTags('billing')
@Controller('v1')
export class MadfamEventsController {
  private readonly logger = new Logger(MadfamEventsController.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly posthog: PostHogService
  ) {
    this.webhookSecret = this.config.get<string>('MADFAM_EVENTS_WEBHOOK_SECRET') ?? '';
    if (!this.webhookSecret) {
      this.logger.warn(
        'MADFAM_EVENTS_WEBHOOK_SECRET is not set — /v1/billing/madfam-events will reject all requests.'
      );
    }
  }

  @Post('billing/madfam-events')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive a signed MADFAM ecosystem event',
    description:
      'HMAC-verified inbound events from RouteCraft / Karafiel / etc. ' +
      'Writes idempotently to the billing ledger so Dhanam reflects every MXN ingress.',
  })
  @ApiOkResponse({ description: 'Event recorded (or duplicate of prior event).' })
  @ApiBadRequestResponse({ description: 'Malformed payload or schema mismatch.' })
  @ApiUnauthorizedResponse({ description: 'Missing / invalid / replayed signature.' })
  async receive(@Req() req: RawBodyRequest<Request>): Promise<{
    billing_event_id: string | null;
    status: 'recorded' | 'duplicate' | 'accepted_unlinked';
    amount_mxn_cents?: number;
    tenant_id?: string | null;
  }> {
    const rawBody = req.rawBody?.toString('utf-8');
    if (!rawBody) {
      throw new UnauthorizedException('missing request body');
    }

    const signatureHeader = this.headerValue(req, 'x-madfam-signature');
    this.verifySignature(rawBody, signatureHeader);

    let payload: EcosystemPaymentSucceededEvent;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new UnauthorizedException('invalid JSON body');
    }
    this.assertPayloadShape(payload);

    // Idempotency — if we've already seen this event_id, return "duplicate".
    const existing = await this.prisma.billingEvent.findUnique({
      where: { stripeEventId: payload.event_id },
    });
    if (existing) {
      return {
        billing_event_id: existing.id,
        status: 'duplicate',
        amount_mxn_cents: Math.round(Number(existing.amount) * 100),
        tenant_id: existing.userId,
      };
    }

    // organization_id → Dhanam user mapping is best-effort. If we don't
    // know the org yet (common for RouteCraft / Karafiel customers who
    // haven't also signed up for Dhanam), accept the event + log + skip
    // the durable row. The probe's HMAC + replay checks already ran.
    const userId = await this.resolveUserForOrganization(payload.organization_id);
    if (!userId) {
      this.logger.log(
        `ecosystem event ${payload.event_id} from org=${payload.organization_id} ` +
          `has no linked Dhanam user — accepted without persisting`
      );
      return {
        billing_event_id: null,
        status: 'accepted_unlinked',
        amount_mxn_cents: payload.amount_minor,
        tenant_id: null,
      };
    }

    const amountMajor = payload.amount_minor / 100;
    const currency = ['MXN', 'USD', 'EUR', 'CAD'].includes(payload.currency)
      ? (payload.currency as 'MXN' | 'USD' | 'EUR' | 'CAD')
      : 'MXN';

    const row = await this.prisma.billingEvent.create({
      data: {
        userId,
        type: 'payment_succeeded',
        amount: amountMajor,
        currency,
        status: 'succeeded',
        stripeEventId: payload.event_id,
        metadata: {
          ecosystem_schema_version: payload.schema_version,
          provider: payload.provider,
          subscription_id: payload.subscription_id,
          organization_id: payload.organization_id,
          occurred_at: payload.occurred_at,
          attribution: payload.attribution ?? null,
          source_metadata: payload.metadata ?? null,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    await this.posthog
      .capture({
        distinctId: userId,
        event: 'ecosystem_payment_succeeded',
        properties: {
          amount_mxn_cents: payload.amount_minor,
          currency: payload.currency,
          provider: payload.provider,
          organization_id: payload.organization_id,
          source_agent_id: payload.attribution?.source_agent_id,
        },
      })
      .catch((err: Error) => this.logger.warn(`posthog capture failed: ${err.message}`));

    await this.audit
      .log({
        userId,
        action: 'ecosystem.payment_received',
        resource: 'billing_event',
        resourceId: row.id,
        metadata: {
          event_id: payload.event_id,
          amount_minor: payload.amount_minor,
          currency: payload.currency,
          provider: payload.provider,
        },
      })
      .catch((err: Error) => this.logger.warn(`audit record failed: ${err.message}`));

    return {
      billing_event_id: row.id,
      status: 'recorded',
      amount_mxn_cents: payload.amount_minor,
      tenant_id: userId,
    };
  }

  @Get('probe/billing-events/:eventId')
  @ApiOperation({
    summary: 'Probe-scoped: verify that an ecosystem event was recorded',
    description:
      'Used by madfam-revenue-loop-probe. Returns 200 with status once the ' +
      'event has been persisted, or 404 if the event_id is unknown.',
  })
  async probeLookup(@Param('eventId') eventId: string): Promise<{
    id: string;
    status: string;
    amount_mxn_cents: number;
    tenant_id: string | null;
  }> {
    const row = await this.prisma.billingEvent.findUnique({
      where: { stripeEventId: eventId },
    });
    if (!row) {
      throw new NotFoundException(`ecosystem event ${eventId} not found`);
    }
    return {
      id: row.id,
      status: row.status,
      amount_mxn_cents: Math.round(Number(row.amount) * 100),
      tenant_id: row.userId,
    };
  }

  // ───────────────── helpers ─────────────────

  private headerValue(req: Request, name: string): string | undefined {
    const v = req.headers[name];
    if (Array.isArray(v)) return v[0];
    return v;
  }

  /**
   * Verify `x-madfam-signature: t=<ts>,v1=<hex>` over `<ts>.<rawBody>`.
   * Throws UnauthorizedException on any failure. Never logs the secret.
   * Implementation lives in `./madfam-events.sig.ts` (pure, unit-tested).
   */
  private verifySignature(rawBody: string, signature: string | undefined): void {
    const result = verifyMadfamSignature(rawBody, signature, this.webhookSecret);
    if (!result.ok) {
      // Keep the failure reason internal — external callers get a generic
      // 401 so we don't leak which dimension of the signature failed.
      this.logger.warn(`rejecting madfam-event: ${result.reason ?? 'unknown'}`);
      throw new UnauthorizedException('invalid or missing signature');
    }
  }

  private assertPayloadShape(payload: EcosystemPaymentSucceededEvent): void {
    if (payload.schema_version !== '1') {
      throw new UnauthorizedException(
        `unsupported ecosystem event schema_version: ${payload.schema_version}`
      );
    }
    const required: (keyof EcosystemPaymentSucceededEvent)[] = [
      'event_id',
      'provider',
      'subscription_id',
      'organization_id',
      'amount_minor',
      'currency',
      'occurred_at',
    ];
    for (const field of required) {
      if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
        throw new UnauthorizedException(`missing required field: ${field}`);
      }
    }
    if (!Number.isFinite(payload.amount_minor) || payload.amount_minor < 0) {
      throw new UnauthorizedException('amount_minor must be a non-negative number');
    }
  }

  /**
   * Map a RouteCraft-side `organization_id` to a Dhanam user. Returns
   * null if no mapping exists — the receiver treats that as "accept but
   * don't persist" so first-touch ecosystem events don't fail loudly.
   *
   * The mapping resolves via the UserSpace join table: a Space's owner
   * is the user with role='owner'. Falls back to admin if no owner is
   * present (defensive — every Space should have exactly one owner per
   * the schema invariant, but we want a deterministic resolution if a
   * Space ends up ownerless during migration windows).
   *
   * History: this function previously selected Space.ownerId, which
   * doesn't exist in the schema. The try/catch swallowed the runtime
   * Prisma error, silently routing every real ecosystem event to
   * status='accepted_unlinked'. Surfaced 2026-04-26 by the synthetic
   * revenue probe (PR #355).
   */
  private async resolveUserForOrganization(organizationId: string): Promise<string | null> {
    if (!organizationId) return null;
    try {
      // organization_id is a Dhanam Space id. Resolve via the
      // UserSpace join table — preferring owner, falling back to admin.
      const ownerLink = await this.prisma.userSpace.findFirst({
        where: { spaceId: organizationId, role: 'owner' },
        select: { userId: true },
      });
      if (ownerLink?.userId) return ownerLink.userId;

      const adminLink = await this.prisma.userSpace.findFirst({
        where: { spaceId: organizationId, role: 'admin' },
        select: { userId: true },
        orderBy: { createdAt: 'asc' },
      });
      if (adminLink?.userId) return adminLink.userId;
    } catch {
      // fall through
    }
    return null;
  }
}
