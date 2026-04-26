/**
 * Webhook DLQ auto-retry cron job.
 *
 * Every 5 minutes, picks up unresolved `WebhookDeliveryFailure` rows
 * whose `next_retry_at <= now()` and `attempt_count < MAX_ATTEMPTS`,
 * and re-POSTs them via `WebhookDlqService.replayDelivery()`.
 *
 * Guarded by `WebhookDlqService.isAutoRetryEnabled()` (env-driven, on
 * in production, off elsewhere) so test suites + local dev don't
 * accidentally hammer real Karafiel / Tezca instances.
 *
 * Backoff schedule + max-attempts policy lives in the service —
 * this job is intentionally a thin scheduler shell.
 *
 * Failure isolation: each row is replayed inside its own try/catch so
 * a malformed row can't poison the rest of the batch. Per-row outcomes
 * are reported via service logging + Sentry; the cron itself only
 * reports aggregate batch totals.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { WebhookDlqService } from '../services/webhook-dlq.service';

/** Max rows to replay per tick. Keeps a tick under ~30s in the worst case. */
export const WEBHOOK_DLQ_BATCH_SIZE = 50;

@Injectable()
export class WebhookDlqRetryJob {
  private readonly logger = new Logger(WebhookDlqRetryJob.name);

  constructor(private readonly dlq: WebhookDlqService) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'webhook-dlq-retry' })
  async tick(): Promise<void> {
    if (!this.dlq.isAutoRetryEnabled()) {
      // Quiet log — this fires every 5 min in dev/staging and we don't
      // want to spam.
      return;
    }

    let due: Awaited<ReturnType<WebhookDlqService['findDueForRetry']>>;
    try {
      due = await this.dlq.findDueForRetry(WEBHOOK_DLQ_BATCH_SIZE);
    } catch (err) {
      this.logger.error(`DLQ findDueForRetry failed: ${(err as Error).message}`);
      return;
    }

    if (due.length === 0) return;

    let resolved = 0;
    let stillFailing = 0;

    for (const row of due) {
      try {
        const result = await this.dlq.replayDelivery(row.id);
        if (result.ok) resolved++;
        else stillFailing++;
      } catch (err) {
        // Service is supposed to never throw; if it does, log + continue.
        this.logger.error(
          `DLQ replay threw for ${row.id} (${row.consumer}): ${(err as Error).message}`
        );
        stillFailing++;
      }
    }

    this.logger.log(
      `DLQ retry tick: ${due.length} due, ${resolved} resolved, ${stillFailing} still failing`
    );
  }
}
