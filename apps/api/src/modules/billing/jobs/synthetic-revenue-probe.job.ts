import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { SyntheticRevenueProbeService } from '../services/synthetic-revenue-probe.service';

/**
 * =============================================================================
 * SyntheticRevenueProbeJob — cron driver for the live monetization smoke test
 * =============================================================================
 *
 * Two crons:
 *   - Every 5 minutes: `runProbe()` — exercises the Stripe → Dhanam →
 *     consumer fan-out path against the live receiver.
 *   - Daily at 4:30 AM UTC: `cleanupOldProbeEvents()` — deletes probe-tagged
 *     BillingEvent rows older than 24h so analytics + the billing ledger
 *     aren't littered with synthetic noise.
 *
 * Both crons are guarded by `SYNTHETIC_PROBE_ENABLED` (default false). In
 * staging/dev/CI the cron silently no-ops. Flip to `true` only in the
 * production ConfigMap so we don't probe staging-only Sentry projects.
 *
 * The probe service itself never throws; this job is just the schedule
 * adapter so it stays a thin wrapper. See `synthetic-revenue-probe.service.ts`
 * for the actual logic + the failure-surface contract.
 * =============================================================================
 */
@Injectable()
export class SyntheticRevenueProbeJob {
  private readonly logger = new Logger(SyntheticRevenueProbeJob.name);
  private running = false; // single-flight guard against overlapping runs

  constructor(private readonly probe: SyntheticRevenueProbeService) {}

  /**
   * Run the probe every 5 minutes (production only). The cron always
   * registers, but the handler short-circuits when the env flag is off so
   * staging never hits api.dhan.am.
   */
  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'synthetic-revenue-probe' })
  async runScheduledProbe(): Promise<void> {
    if (!this.probe.isEnabled()) return;
    if (this.running) {
      this.logger.warn('synthetic_revenue_probe overlap — skipping (previous run still active)');
      return;
    }
    this.running = true;
    try {
      await this.probe.runProbe();
    } catch (err) {
      // Defense-in-depth: runProbe should never throw, but if it does, swallow
      // here so a probe bug doesn't crash the API process.
      this.logger.error(
        `synthetic_revenue_probe wrapper caught unexpected error: ${(err as Error).message}`
      );
    } finally {
      this.running = false;
    }
  }

  /**
   * Daily cleanup of probe-tagged BillingEvent rows older than 24h. Runs
   * even when `SYNTHETIC_PROBE_ENABLED=false` so legacy rows from any prior
   * enablement still get reaped — but only when there's something to clean.
   */
  @Cron('30 4 * * *', { name: 'synthetic-revenue-probe-cleanup' })
  async runScheduledCleanup(): Promise<void> {
    try {
      const deleted = await this.probe.cleanupOldProbeEvents();
      if (deleted > 0) {
        this.logger.log(`synthetic_revenue_probe_cleanup deleted=${deleted}`);
      }
    } catch (err) {
      this.logger.error(`synthetic_revenue_probe_cleanup_failed: ${(err as Error).message}`);
    }
  }
}
