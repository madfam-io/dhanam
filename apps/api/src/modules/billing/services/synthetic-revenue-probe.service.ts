import { createHmac, randomBytes } from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';

import { PrismaService } from '../../../core/prisma/prisma.service';

/**
 * =============================================================================
 * Synthetic Revenue Probe — Stripe → Dhanam → consumer fan-out smoke test
 * =============================================================================
 *
 * Self-fires a synthetic MADFAM ecosystem event every 5 minutes (driven by
 * `SyntheticRevenueProbeJob`) so we get an early warning when the live
 * production money path silently breaks. Per the 2026-04-26 monetization
 * audit (`internal-devops/ecosystem/monetization-architecture-2026-04-26.md`,
 * Principle #1): one synthetic test per money path, paging on failure, is the
 * single highest-ROI monitoring investment we can make right now.
 *
 * What this exercises end-to-end (against the live API):
 *   1. HMAC `x-madfam-signature` verification path
 *   2. Schema validation of the ecosystem event envelope
 *   3. `BillingEvent.stripeEventId` idempotency check (DB read)
 *   4. The persistence path (DB write — only when org→user resolves)
 *   5. The probe-lookup endpoint (`GET /v1/probe/billing-events/:eventId`)
 *   6. Consumer health (best-effort `/health` probe of fan-out targets)
 *
 * What this *does not* trigger:
 *   - Real Stripe API calls (no money is ever charged)
 *   - CFDI emission on Karafiel (consumers ignore probe events; see fan-out
 *     verification trade-off note below)
 *   - Customer-facing notifications (no PostHog/email side-effects beyond the
 *     existing receiver bookkeeping, which is event-typed `payment_succeeded`
 *     but tagged `provider: "probe"` in metadata so dashboards can filter)
 *
 * Failure surface:
 *   - Structured ERROR log line: `synthetic_revenue_probe_failed`
 *   - Sentry event with tag `synthetic_revenue_probe_failed=true` so ops can
 *     hook PagerDuty by tag (no new alerting library introduced).
 *
 * Trust model:
 *   The probe is an *early warning*, not an alerting system. Every failure
 *   mode below is a concrete production issue (signature drift, replay
 *   window misconfig, DB unavailable, consumer down). False positives are
 *   unacceptable — bias toward `degraded` (logged but not paged) for ambiguous
 *   states like "no Space exists yet so org→user can't resolve". See
 *   `ProbeStage` for the per-stage status taxonomy.
 *
 * Fan-out verification trade-off:
 *   The prompt offered two options. We pick (b) /health probes of consumer
 *   endpoints derived from `PRODUCT_WEBHOOK_URLS`. Rationale:
 *     - (a) requires a queryable dispatch log on the relay service which
 *       does not exist today — adding it is a separate concern (T2.2 DLQ).
 *     - (b) is a weaker signal but achievable in this PR. It catches the
 *       common "consumer is down" failure mode (which would also break real
 *       payments) without a schema change. Documented in the PR as a known
 *       limitation: a 200 from `/health` proves the consumer is alive but
 *       NOT that it correctly processed our probe event.
 *   Future work (flagged in the PR): emit probe events on a separate type
 *   that consumers acknowledge with a probe-specific 200, then assert via
 *   the relay's dispatch log.
 * =============================================================================
 */

export type ProbeStage =
  | 'config_check'
  | 'self_fire'
  | 'verify_persisted'
  | 'verify_consumers'
  | 'timeout';

export type ProbeStageStatus = 'ok' | 'failed' | 'skipped' | 'degraded';

export interface ProbeStageResult {
  stage: ProbeStage;
  status: ProbeStageStatus;
  durationMs: number;
  detail?: string;
  error?: string;
}

export interface ProbeRunResult {
  eventId: string;
  ok: boolean;
  totalMs: number;
  stages: ProbeStageResult[];
}

interface MadfamProbeEnvelope {
  schema_version: '1';
  event_id: string;
  provider: 'probe';
  subscription_id: string;
  organization_id: string;
  amount_minor: number;
  currency: 'MXN';
  occurred_at: string;
  metadata: {
    probe: true;
    note: string;
  };
}

const PROBE_AMOUNT_MINOR = 1; // 1 cent — never reaches Stripe; just satisfies receiver schema (>= 0)
const PROBE_TIMEOUT_MS = 30_000; // hard ceiling per probe run (per spec)
const PROBE_VERIFY_DEADLINE_MS = 60_000; // verify-persisted has up to 60s; bounded by PROBE_TIMEOUT_MS overall
const CONSUMER_HEALTH_TIMEOUT_MS = 5_000;

@Injectable()
export class SyntheticRevenueProbeService {
  private readonly logger = new Logger(SyntheticRevenueProbeService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * True when the probe should run in this environment. Defaults to OFF in
   * dev/staging/CI so unit tests + local dev don't hit the live receiver.
   */
  isEnabled(): boolean {
    const flag = (this.config.get<string>('SYNTHETIC_PROBE_ENABLED') ?? 'false').toLowerCase();
    return flag === 'true' || flag === '1' || flag === 'yes';
  }

  /**
   * Run one probe iteration end-to-end. Always returns a result (never
   * throws) — failures are reflected in `result.ok = false` and emitted to
   * Sentry + structured logs.
   */
  async runProbe(): Promise<ProbeRunResult> {
    const eventId = `probe-${Date.now()}-${randomBytes(4).toString('hex')}`;
    const t0 = Date.now();
    const stages: ProbeStageResult[] = [];

    // Stage 0 — config preflight
    const configStage = this.checkConfig();
    stages.push(configStage);
    if (configStage.status === 'failed') {
      return this.finalize(eventId, stages, t0, false);
    }

    // Wrap remaining stages in a 30s overall hard timeout. If any stage
    // blocks, we record a `timeout` stage and bail.
    let overallOk = true;
    try {
      await this.withDeadline(PROBE_TIMEOUT_MS, async () => {
        // Stage 1 — self-fire
        const fireStage = await this.timed('self_fire', () => this.selfFire(eventId));
        stages.push(fireStage);
        if (fireStage.status === 'failed') {
          overallOk = false;
          return;
        }
        const fireDetail = this.parseSelfFireDetail(fireStage.detail);

        // Stage 2 — verify persistence (only meaningful when we got "recorded")
        const verifyStage = await this.timed('verify_persisted', () =>
          this.verifyPersisted(eventId, fireDetail.receiverStatus)
        );
        stages.push(verifyStage);
        if (verifyStage.status === 'failed') {
          overallOk = false;
        }

        // Stage 3 — consumer health (best-effort; degraded ≠ failed)
        const consumerStage = await this.timed('verify_consumers', () => this.verifyConsumers());
        stages.push(consumerStage);
        if (consumerStage.status === 'failed') {
          overallOk = false;
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      stages.push({
        stage: 'timeout',
        status: 'failed',
        durationMs: Date.now() - t0,
        error: message,
      });
      overallOk = false;
    }

    return this.finalize(eventId, stages, t0, overallOk);
  }

  // ─── stages ─────────────────────────────────────────────────────────────

  private checkConfig(): ProbeStageResult {
    const missing: string[] = [];
    if (!this.config.get<string>('MADFAM_EVENTS_WEBHOOK_SECRET')) {
      missing.push('MADFAM_EVENTS_WEBHOOK_SECRET');
    }
    if (!this.config.get<string>('SYNTHETIC_PROBE_BASE_URL')) {
      // Default is acceptable; not strictly required.
    }
    if (missing.length) {
      return {
        stage: 'config_check',
        status: 'failed',
        durationMs: 0,
        error: `missing_env: ${missing.join(',')}`,
      };
    }
    return { stage: 'config_check', status: 'ok', durationMs: 0 };
  }

  private async selfFire(eventId: string): Promise<{
    status: ProbeStageStatus;
    detail?: string;
    error?: string;
  }> {
    const baseUrl = this.config.get<string>(
      'SYNTHETIC_PROBE_BASE_URL',
      'https://api.dhan.am'
    ) as string;
    const secret = this.config.get<string>('MADFAM_EVENTS_WEBHOOK_SECRET', '') as string;

    // Pick an organization_id that has a non-zero chance of resolving to a
    // user — first non-deleted Space. If none exist (fresh DB), fall back to
    // a synthetic UUID; the receiver returns `accepted_unlinked` which is
    // still a successful POST path.
    const orgId = await this.findProbeOrganizationId();

    const envelope: MadfamProbeEnvelope = {
      schema_version: '1',
      event_id: eventId,
      provider: 'probe',
      subscription_id: `probe-sub-${eventId}`,
      organization_id: orgId,
      amount_minor: PROBE_AMOUNT_MINOR,
      currency: 'MXN',
      occurred_at: new Date().toISOString(),
      metadata: {
        probe: true,
        note: 'synthetic_revenue_probe — safe to ignore; deleted within 24h',
      },
    };
    const rawBody = JSON.stringify(envelope);
    const ts = Math.floor(Date.now() / 1000);
    const sig = createHmac('sha256', secret).update(`${ts}.${rawBody}`).digest('hex');

    const url = `${baseUrl.replace(/\/+$/, '')}/v1/billing/madfam-events`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-madfam-signature': `t=${ts},v1=${sig}`,
          'User-Agent': 'dhanam-synthetic-probe/1',
        },
        body: rawBody,
      });
    } catch (err) {
      return {
        status: 'failed',
        error: `fetch_failed: ${(err as Error).message}`,
      };
    }
    if (!res.ok) {
      const text = await this.safeReadText(res);
      return {
        status: 'failed',
        error: `http_${res.status}: ${text.slice(0, 200)}`,
      };
    }
    let body: { status?: string; billing_event_id?: string | null };
    try {
      body = (await res.json()) as { status?: string; billing_event_id?: string | null };
    } catch {
      return { status: 'failed', error: 'response_not_json' };
    }
    const receiverStatus = body.status ?? 'unknown';
    const acceptable = ['recorded', 'duplicate', 'accepted_unlinked'];
    if (!acceptable.includes(receiverStatus)) {
      return {
        status: 'failed',
        error: `unexpected_receiver_status: ${receiverStatus}`,
      };
    }
    return {
      status: 'ok',
      detail: `receiver_status=${receiverStatus}`,
    };
  }

  /**
   * Verify the BillingEvent landed in the DB. Two cases:
   *   - receiver returned `recorded` → must find row + GET endpoint must 200
   *   - receiver returned `accepted_unlinked` → no row to verify; DB write
   *     was intentionally skipped. Stage is `degraded` (a real signal: the
   *     org→user mapping is broken, which the operator should fix, but the
   *     receiver itself is healthy).
   *   - `duplicate` → unexpected on a fresh event_id; treat as failed.
   */
  private async verifyPersisted(
    eventId: string,
    receiverStatus: string | undefined
  ): Promise<{ status: ProbeStageStatus; detail?: string; error?: string }> {
    if (receiverStatus === 'accepted_unlinked') {
      return {
        status: 'degraded',
        detail: 'receiver_accepted_unlinked_skip_verify',
      };
    }
    if (receiverStatus === 'duplicate') {
      return {
        status: 'failed',
        error: 'duplicate_on_fresh_event_id',
      };
    }
    // Poll the DB for up to PROBE_VERIFY_DEADLINE_MS (60s) — receiver writes
    // synchronously today but we tolerate replication lag if the path ever
    // becomes async. Backoff: 200ms → 500ms → 1s → 2s → 2s …
    const deadline = Date.now() + PROBE_VERIFY_DEADLINE_MS;
    let delayMs = 200;
    let lastErr: string | undefined;
    while (Date.now() < deadline) {
      try {
        const row = await this.prisma.billingEvent.findUnique({
          where: { stripeEventId: eventId },
        });
        if (row) {
          // Bonus: hit the GET endpoint over HTTP so we exercise the read
          // path that consumers actually use.
          const httpVerify = await this.verifyViaHttp(eventId);
          if (!httpVerify.ok) {
            return {
              status: 'failed',
              error: `db_ok_http_failed: ${httpVerify.error}`,
            };
          }
          return {
            status: 'ok',
            detail: `billing_event_id=${row.id} status=${row.status}`,
          };
        }
      } catch (err) {
        lastErr = (err as Error).message;
      }
      await this.sleep(delayMs);
      delayMs = Math.min(delayMs * 2, 2000);
    }
    return {
      status: 'failed',
      error: lastErr ?? 'persisted_row_not_found_within_deadline',
    };
  }

  private async verifyViaHttp(eventId: string): Promise<{ ok: boolean; error?: string }> {
    const baseUrl = this.config.get<string>(
      'SYNTHETIC_PROBE_BASE_URL',
      'https://api.dhan.am'
    ) as string;
    const url = `${baseUrl.replace(/\/+$/, '')}/v1/probe/billing-events/${encodeURIComponent(
      eventId
    )}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'dhanam-synthetic-probe/1' },
      });
      if (!res.ok) {
        return { ok: false, error: `http_${res.status}` };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: `fetch_failed: ${(err as Error).message}` };
    }
  }

  /**
   * Best-effort consumer health probe. Hits `<origin>/health` for each
   * `PRODUCT_WEBHOOK_URLS` target. A consumer down here means real
   * payments are also failing fan-out → worth logging but treated as
   * `degraded` (not `failed`) to avoid pager fatigue: fan-out failure is
   * orthogonal to the receiver path and Stripe will retry to us anyway.
   *
   * Trade-off documented at the top of this file: a 200 here proves the
   * consumer is *alive*, NOT that it correctly processed our probe event.
   */
  private async verifyConsumers(): Promise<{
    status: ProbeStageStatus;
    detail?: string;
    error?: string;
  }> {
    const cfg = this.config.get<string>('PRODUCT_WEBHOOK_URLS', '') ?? '';
    if (!cfg.trim()) {
      return { status: 'skipped', detail: 'no_product_webhook_urls_configured' };
    }
    const targets: Array<{ product: string; healthUrl: string }> = [];
    for (const entry of cfg.split(',')) {
      const trimmed = entry.trim();
      if (!trimmed) continue;
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx <= 0) continue;
      const product = trimmed.slice(0, colonIdx).trim();
      const url = trimmed.slice(colonIdx + 1).trim();
      if (!product || !url) continue;
      try {
        const u = new URL(url);
        targets.push({
          product,
          healthUrl: `${u.origin}/health`,
        });
      } catch {
        // malformed URL — skip silently; the relay-side log will already
        // surface this as a config error.
      }
    }
    if (targets.length === 0) {
      return { status: 'skipped', detail: 'no_valid_targets_parsed' };
    }
    const results = await Promise.all(
      targets.map(async (t) => {
        try {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), CONSUMER_HEALTH_TIMEOUT_MS);
          try {
            const res = await fetch(t.healthUrl, {
              method: 'GET',
              headers: { 'User-Agent': 'dhanam-synthetic-probe/1' },
              signal: controller.signal,
            });
            return { product: t.product, ok: res.ok, status: res.status };
          } finally {
            clearTimeout(tid);
          }
        } catch (err) {
          return {
            product: t.product,
            ok: false,
            status: 0,
            err: (err as Error).message,
          };
        }
      })
    );
    const failures = results.filter((r) => !r.ok);
    if (failures.length === 0) {
      return {
        status: 'ok',
        detail: results.map((r) => `${r.product}=${r.status}`).join(','),
      };
    }
    // Any consumer down → degraded, not failed (see rationale above).
    return {
      status: 'degraded',
      detail: results.map((r) => `${r.product}=${r.status}`).join(','),
      error: failures
        .map((r) => `${r.product}:${(r as { err?: string }).err ?? r.status}`)
        .join(';'),
    };
  }

  // ─── helpers ────────────────────────────────────────────────────────────

  /**
   * Find a Space id we can use as `organization_id`. Prefers the oldest
   * non-deleted Space (so the same row is reused across runs, keeping the
   * probe BillingEvent rows clustered under one user for easier cleanup).
   * Returns a synthetic UUID if no Space exists.
   */
  private async findProbeOrganizationId(): Promise<string> {
    try {
      const space = await this.prisma.space.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (space) return space.id;
    } catch (err) {
      this.logger.warn(
        `findProbeOrganizationId fell back to synthetic UUID: ${(err as Error).message}`
      );
    }
    return `probe-org-${randomBytes(8).toString('hex')}`;
  }

  /**
   * Delete probe-tagged BillingEvent rows older than 24h. Driven by the
   * cleanup cron in `SyntheticRevenueProbeJob`. Returns the deletion count
   * for observability.
   */
  async cleanupOldProbeEvents(): Promise<number> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // Probe rows are identifiable two ways:
    //   (a) stripeEventId starts with 'probe-' (set by selfFire)
    //   (b) metadata.provider = 'probe' (defensive — some receivers may
    //       map the field; (a) is authoritative)
    // Prisma doesn't support `startsWith` on indexed string columns
    // directly via `delete`, so we use deleteMany with a startsWith filter.
    const result = await this.prisma.billingEvent.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        stripeEventId: { startsWith: 'probe-' },
      },
    });
    return result.count;
  }

  private async timed(
    stage: ProbeStage,
    fn: () => Promise<{ status: ProbeStageStatus; detail?: string; error?: string }>
  ): Promise<ProbeStageResult> {
    const start = Date.now();
    try {
      const r = await fn();
      return {
        stage,
        status: r.status,
        durationMs: Date.now() - start,
        detail: r.detail,
        error: r.error,
      };
    } catch (err) {
      return {
        stage,
        status: 'failed',
        durationMs: Date.now() - start,
        error: `unhandled: ${(err as Error).message}`,
      };
    }
  }

  private finalize(
    eventId: string,
    stages: ProbeStageResult[],
    startedAt: number,
    ok: boolean
  ): ProbeRunResult {
    const totalMs = Date.now() - startedAt;
    const result: ProbeRunResult = { eventId, ok, totalMs, stages };

    if (ok) {
      this.logger.log(
        `synthetic_revenue_probe_ok event_id=${eventId} total_ms=${totalMs} stages=${this.compactStages(
          stages
        )}`
      );
      return result;
    }

    // Failure path — structured log + Sentry. Keep the log message
    // grep-able: ops alerts will key off the `synthetic_revenue_probe_failed`
    // string and the Sentry tag of the same name.
    const firstFail = stages.find((s) => s.status === 'failed') ??
      stages[stages.length - 1] ?? {
        stage: 'config_check' as ProbeStage,
        status: 'failed' as ProbeStageStatus,
        durationMs: 0,
      };
    const summary = {
      synthetic_revenue_probe_failed: {
        event_id: eventId,
        stage: firstFail.stage,
        error: firstFail.error ?? 'unknown',
        timing_ms: totalMs,
        stages: this.compactStages(stages),
      },
    };
    this.logger.error(JSON.stringify(summary));

    Sentry.withScope((scope) => {
      scope.setTag('synthetic_revenue_probe_failed', 'true');
      scope.setTag('probe.stage', firstFail.stage);
      scope.setTag('probe.event_id', eventId);
      scope.setContext('probe', {
        eventId,
        totalMs,
        stages,
      });
      scope.setLevel('error');
      Sentry.captureMessage(`synthetic_revenue_probe_failed at stage=${firstFail.stage}`, 'error');
    });

    return result;
  }

  private compactStages(stages: ProbeStageResult[]): string {
    return stages.map((s) => `${s.stage}:${s.status}(${s.durationMs}ms)`).join('|');
  }

  private parseSelfFireDetail(detail?: string): { receiverStatus?: string } {
    if (!detail) return {};
    const m = detail.match(/receiver_status=(\w+)/);
    return { receiverStatus: m?.[1] };
  }

  private async safeReadText(res: Response): Promise<string> {
    try {
      return await res.text();
    } catch {
      return '<unreadable>';
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Race a promise against a hard deadline. If the deadline trips first, we
   * throw a `Timeout` error so the caller can record a `timeout` stage. Note
   * the underlying work continues — we can't actually cancel a fetch from
   * here without an AbortController plumbed through every stage; this is
   * acceptable for a 30s probe that runs every 5min (no compounding cost).
   */
  private withDeadline<T>(timeoutMs: number, fn: () => Promise<T>): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`probe_deadline_exceeded_${timeoutMs}ms`)),
        timeoutMs
      );
    });
    return Promise.race([
      fn().finally(() => {
        if (timer) clearTimeout(timer);
      }),
      timeout,
    ]);
  }
}
