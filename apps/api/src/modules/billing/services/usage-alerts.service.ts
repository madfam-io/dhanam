/**
 * Usage Alerts Service (P2.2)
 * ==========================================================================
 * Receives budget-threshold-crossing webhooks from Enclii's Waybill evaluator
 * and notifies the project owner.
 *
 * This is the *ingest* side of the P2.2 pipeline. Waybill owns budget state
 * and computes crossings; Dhanam owns notification delivery (email today,
 * optional Slack later).
 *
 * Idempotency
 * -----------
 * Waybill guarantees at-least-once delivery and sends the same
 * (project_id, period, threshold) tuple on retries. We enforce exactly-once
 * by storing those tuples on the `UsageAlertIngest` Prisma model with a
 * composite unique index. Duplicate pings update `lastSeenAt` without
 * re-notifying.
 *
 * Transport
 * ---------
 * The handler sits behind HMAC-SHA256 verification keyed on
 * WAYBILL_ALERT_SIGNING_KEY. The envelope format matches the rest of the
 * MADFAM ecosystem (`t=<unix>,v1=<hex>` with HMAC over `${t}.${rawBody}`),
 * via verifyMadfamSignature().
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { EmailService } from '../../email/email.service';

/**
 * Payload schema sent by Waybill. Mirrors `DispatchPayload` in
 * `apps/waybill/internal/alerts/evaluator.go`.
 */
export interface WaybillAlertPayload {
  alert_id: string;
  project_id: string;
  budget_id: string;
  period: string;
  period_start: string;
  period_end: string;
  threshold_crossed: number;
  actual_cents: number;
  budget_cents: number;
  currency?: string;
  service_breakdown?: Record<string, number>;
}

export interface IngestResult {
  status: 'accepted' | 'duplicate';
  alertId: string;
  threshold: number;
  notified: boolean;
}

@Injectable()
export class UsageAlertsService {
  private readonly logger = new Logger(UsageAlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService
  ) {}

  /**
   * Persist the alert (idempotently) and, for first-seen events, queue an
   * email to the project owner.
   */
  async ingest(payload: WaybillAlertPayload): Promise<IngestResult> {
    validatePayload(payload);

    const periodStart = new Date(payload.period_start);
    if (Number.isNaN(periodStart.getTime())) {
      throw new Error('invalid period_start');
    }

    // Idempotency: (project_id, period_start, threshold) tuple. Re-inserts
    // are caught by the unique constraint; we then `update` to refresh
    // lastSeenAt and bump seenCount without double-notifying.
    const existing = await this.prisma.usageAlertIngest.findUnique({
      where: {
        projectId_periodStart_thresholdCrossed: {
          projectId: payload.project_id,
          periodStart,
          thresholdCrossed: payload.threshold_crossed,
        },
      },
    });

    if (existing) {
      await this.prisma.usageAlertIngest.update({
        where: { id: existing.id },
        data: {
          lastSeenAt: new Date(),
          seenCount: { increment: 1 },
        },
      });
      this.logger.log(
        `duplicate alert ignored project=${payload.project_id} threshold=${payload.threshold_crossed}`
      );
      return {
        status: 'duplicate',
        alertId: existing.id,
        threshold: payload.threshold_crossed,
        notified: false,
      };
    }

    const row = await this.prisma.usageAlertIngest.create({
      data: {
        waybillAlertId: payload.alert_id,
        projectId: payload.project_id,
        budgetId: payload.budget_id,
        period: payload.period,
        periodStart,
        periodEnd: new Date(payload.period_end),
        thresholdCrossed: payload.threshold_crossed,
        actualCents: payload.actual_cents,
        budgetCents: payload.budget_cents,
        currency: payload.currency ?? 'USD',
        serviceBreakdown: (payload.service_breakdown ?? null) as never,
        seenCount: 1,
        lastSeenAt: new Date(),
      },
    });

    // Try to locate a project owner via the Projects table. When we can't
    // resolve the owner (e.g. the project lives in Enclii and hasn't been
    // federated to Dhanam yet), we still store the alert so operators can
    // inspect it — notifications are best-effort.
    let notified = false;
    try {
      notified = await this.tryNotify(row.id, payload);
    } catch (err) {
      this.logger.error(
        `alert stored but notification failed project=${payload.project_id}: ${(err as Error).message}`
      );
    }

    return {
      status: 'accepted',
      alertId: row.id,
      threshold: payload.threshold_crossed,
      notified,
    };
  }

  /**
   * Attempts email delivery for a freshly-stored alert. Returns true when a
   * notification was dispatched, false when there was nobody to notify.
   */
  private async tryNotify(ingestRowId: string, payload: WaybillAlertPayload): Promise<boolean> {
    // Recipient resolution. Enclii projects don't have a native "owner email"
    // in Dhanam — the federation pipeline will wire that up when customers
    // connect the two. For the P2.2 bootstrap we lean on an env-configured
    // fallback inbox (operations@) so alerts are always delivered somewhere
    // visible. Future work: look up via CustomerFederation when present.
    const fallbackTo = this.config.get<string>('WAYBILL_ALERT_FALLBACK_EMAIL');
    if (!fallbackTo) {
      this.logger.warn(
        `no recipient for alert project=${payload.project_id}; set WAYBILL_ALERT_FALLBACK_EMAIL to enable delivery`
      );
      return false;
    }

    const amount = formatCents(payload.actual_cents, payload.currency ?? 'USD');
    const budget = formatCents(payload.budget_cents, payload.currency ?? 'USD');
    const subject = `Budget alert: ${payload.threshold_crossed}% (${amount} of ${budget})`;

    await this.email.sendEmail({
      to: fallbackTo,
      subject,
      template: 'budget-alert',
      context: {
        name: 'there',
        budgetName: payload.project_id,
        percentage: payload.threshold_crossed,
        spent: payload.actual_cents / 100,
        limit: payload.budget_cents / 100,
        currency: payload.currency ?? 'USD',
        remaining: Math.max(0, (payload.budget_cents - payload.actual_cents) / 100),
      },
      priority: payload.threshold_crossed >= 100 ? 'high' : 'normal',
    });

    await this.prisma.usageAlertIngest.update({
      where: { id: ingestRowId },
      data: { notifiedAt: new Date() },
    });

    this.logger.log(
      `notified ${fallbackTo} for project=${payload.project_id} threshold=${payload.threshold_crossed}%`
    );
    return true;
  }
}

function validatePayload(p: WaybillAlertPayload): void {
  const required = [
    'alert_id',
    'project_id',
    'budget_id',
    'period',
    'period_start',
    'period_end',
    'threshold_crossed',
    'actual_cents',
    'budget_cents',
  ];
  for (const key of required) {
    if ((p as unknown as Record<string, unknown>)[key] === undefined) {
      throw new Error(`missing required field: ${key}`);
    }
  }
  if (!Number.isFinite(p.threshold_crossed) || p.threshold_crossed <= 0) {
    throw new Error('threshold_crossed must be a positive number');
  }
  if (!Number.isInteger(p.actual_cents) || p.actual_cents < 0) {
    throw new Error('actual_cents must be a non-negative integer');
  }
  if (!Number.isInteger(p.budget_cents) || p.budget_cents <= 0) {
    throw new Error('budget_cents must be a positive integer');
  }
}

function formatCents(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
