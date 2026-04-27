/**
 * Unit tests for WebhookDlqService — failure persistence, replay,
 * exponential backoff, max-attempts cap, and resolution paths.
 *
 * Prisma is mocked (no DB roundtrip). `globalThis.fetch` is mocked
 * for replay HTTP calls.
 */

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  WEBHOOK_DLQ_MAX_ATTEMPTS,
  WebhookDlqService,
  computeNextRetry,
} from '../services/webhook-dlq.service';

function makePrismaMock() {
  return {
    webhookDeliveryFailure: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };
}

function makeConfigMock(overrides: Record<string, string> = {}) {
  return {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key in overrides) return overrides[key];
      return defaultValue;
    }),
  };
}

describe('WebhookDlqService', () => {
  let service: WebhookDlqService;
  let prisma: ReturnType<typeof makePrismaMock>;
  let config: ReturnType<typeof makeConfigMock>;
  let sentry: { captureMessage: jest.Mock };
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    prisma = makePrismaMock();
    config = makeConfigMock();
    sentry = { captureMessage: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookDlqService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
        { provide: 'SentryService', useValue: sentry },
      ],
    }).compile();

    service = module.get(WebhookDlqService);

    fetchMock = jest.fn();
    (globalThis as any).fetch = fetchMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete (globalThis as any).fetch;
  });

  // ─── recordFailure ───────────────────────────────────────────────────

  describe('recordFailure', () => {
    it('persists the failed delivery with attempt_count=1 and next_retry_at ~1min in the future', async () => {
      const before = Date.now();
      prisma.webhookDeliveryFailure.create.mockResolvedValue({ id: 'dlq-1' });

      await service.recordFailure({
        eventId: 'env-abc',
        consumer: 'karafiel',
        consumerUrl: 'https://api.karafiel.mx/api/v1/webhooks/dhanam',
        eventType: 'payment.succeeded',
        payload: { type: 'payment.succeeded', id: 'env-abc' },
        signatureHeader: 'sig-deadbeef',
        statusCode: 503,
        errorMessage: 'consumer responded 503: maintenance',
      });

      expect(prisma.webhookDeliveryFailure.create).toHaveBeenCalledTimes(1);
      const data = prisma.webhookDeliveryFailure.create.mock.calls[0][0].data;

      expect(data.eventId).toBe('env-abc');
      expect(data.consumer).toBe('karafiel');
      expect(data.consumerUrl).toBe('https://api.karafiel.mx/api/v1/webhooks/dhanam');
      expect(data.eventType).toBe('payment.succeeded');
      expect(data.signatureHeader).toBe('sig-deadbeef');
      expect(data.attemptCount).toBe(1);
      expect(data.lastStatusCode).toBe(503);
      expect(data.lastErrorMessage).toBe('consumer responded 503: maintenance');

      // next_retry should be ~1 minute (BASE * 2^1) from now.
      const nextRetryMs = (data.nextRetryAt as Date).getTime() - before;
      expect(nextRetryMs).toBeGreaterThanOrEqual(2 * 60 * 1000 - 100);
      expect(nextRetryMs).toBeLessThanOrEqual(2 * 60 * 1000 + 1000);
    });

    it('emits a Sentry warning with structured failure context', async () => {
      prisma.webhookDeliveryFailure.create.mockResolvedValue({ id: 'dlq-2' });

      await service.recordFailure({
        eventId: 'env-xyz',
        consumer: 'tezca',
        consumerUrl: 'https://example.com',
        eventType: 'subscription.created',
        payload: {},
        signatureHeader: 'sig',
        statusCode: 502,
        errorMessage: 'bad gateway',
      });

      expect(sentry.captureMessage).toHaveBeenCalledWith(
        'Webhook delivery failed: tezca',
        'warning',
        expect.objectContaining({
          event_id: 'env-xyz',
          consumer: 'tezca',
          attempt: 1,
          status_code: 502,
          error_message: 'bad gateway',
          dlq_id: 'dlq-2',
        })
      );
    });

    it('truncates pathologically long error messages so the DB row stays small', async () => {
      prisma.webhookDeliveryFailure.create.mockResolvedValue({ id: 'dlq-3' });
      const huge = 'x'.repeat(10000);

      await service.recordFailure({
        eventId: 'e1',
        consumer: 'k',
        consumerUrl: 'u',
        payload: {},
        signatureHeader: 's',
        errorMessage: huge,
      });

      const data = prisma.webhookDeliveryFailure.create.mock.calls[0][0].data;
      expect(data.lastErrorMessage.length).toBeLessThanOrEqual(2048);
      expect(data.lastErrorMessage.endsWith('...')).toBe(true);
    });
  });

  // ─── replayDelivery: success path ────────────────────────────────────

  describe('replayDelivery — success path', () => {
    it('on 2xx, marks the row resolved and clears next_retry_at', async () => {
      prisma.webhookDeliveryFailure.findUnique.mockResolvedValue({
        id: 'dlq-1',
        eventId: 'env-abc',
        consumer: 'karafiel',
        consumerUrl: 'https://k.example.com/webhook',
        eventType: 'payment.succeeded',
        payload: { hello: 'world' },
        signatureHeader: 'sig-1',
        attemptCount: 2,
        resolvedAt: null,
      });
      prisma.webhookDeliveryFailure.update.mockResolvedValue({
        id: 'dlq-1',
        attemptCount: 3,
        nextRetryAt: null,
        resolvedAt: new Date(),
      });
      fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => 'ok' });

      const result = await service.replayDelivery('dlq-1');

      expect(result.ok).toBe(true);
      expect(result.resolvedAt).not.toBeNull();
      // Body must be the persisted payload, signature replayed verbatim.
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://k.example.com/webhook');
      expect(init.headers['X-Dhanam-Signature']).toBe('sig-1');
      expect(init.headers['X-Dhanam-Replay']).toBe('true');
      expect(init.headers['X-Dhanam-Replay-Attempt']).toBe('3');
      expect(JSON.parse(init.body)).toEqual({ hello: 'world' });

      // Update zeroed out next_retry_at and stamped resolved_at.
      const updateData = prisma.webhookDeliveryFailure.update.mock.calls[0][0].data;
      expect(updateData.nextRetryAt).toBeNull();
      expect(updateData.resolvedAt).toBeInstanceOf(Date);
      expect(updateData.lastErrorMessage).toBeNull();
    });

    it('force=true resets attempt to 1 (manual replay UX)', async () => {
      prisma.webhookDeliveryFailure.findUnique.mockResolvedValue({
        id: 'dlq-1',
        eventId: 'env-abc',
        consumer: 'karafiel',
        consumerUrl: 'https://k.example.com/webhook',
        eventType: 'payment.succeeded',
        payload: {},
        signatureHeader: 'sig-1',
        attemptCount: 7,
        resolvedAt: null,
      });
      prisma.webhookDeliveryFailure.update.mockResolvedValue({
        id: 'dlq-1',
        attemptCount: 1,
        nextRetryAt: null,
        resolvedAt: new Date(),
      });
      fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => 'ok' });

      await service.replayDelivery('dlq-1', { force: true });

      const updateData = prisma.webhookDeliveryFailure.update.mock.calls[0][0].data;
      expect(updateData.attemptCount).toBe(1);
      expect(fetchMock.mock.calls[0][1].headers['X-Dhanam-Replay-Attempt']).toBe('1');
    });
  });

  // ─── replayDelivery: failure path + backoff ──────────────────────────

  describe('replayDelivery — failure path', () => {
    it('on 5xx, increments attempt_count and schedules next_retry_at via 2^n backoff', async () => {
      prisma.webhookDeliveryFailure.findUnique.mockResolvedValue({
        id: 'dlq-1',
        eventId: 'env',
        consumer: 'karafiel',
        consumerUrl: 'https://k.example.com',
        eventType: 'payment.succeeded',
        payload: {},
        signatureHeader: 's',
        attemptCount: 3,
        resolvedAt: null,
      });
      prisma.webhookDeliveryFailure.update.mockResolvedValue({
        id: 'dlq-1',
        attemptCount: 4,
        nextRetryAt: new Date(Date.now() + 16 * 60 * 1000),
        resolvedAt: null,
      });
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => 'maintenance',
      });

      const before = Date.now();
      const result = await service.replayDelivery('dlq-1');
      expect(result.ok).toBe(false);

      const updateData = prisma.webhookDeliveryFailure.update.mock.calls[0][0].data;
      expect(updateData.attemptCount).toBe(4);
      expect(updateData.lastStatusCode).toBe(503);
      expect(updateData.lastErrorMessage).toContain('503');

      // 2^4 = 16 minutes from now.
      const dt = (updateData.nextRetryAt as Date).getTime() - before;
      expect(dt).toBeGreaterThanOrEqual(16 * 60 * 1000 - 100);
      expect(dt).toBeLessThanOrEqual(16 * 60 * 1000 + 1000);
    });

    it('on network error, captures it as next_retry-eligible (non-exhausted)', async () => {
      prisma.webhookDeliveryFailure.findUnique.mockResolvedValue({
        id: 'dlq-1',
        eventId: 'env',
        consumer: 'karafiel',
        consumerUrl: 'https://k.example.com',
        eventType: 'payment.succeeded',
        payload: {},
        signatureHeader: 's',
        attemptCount: 1,
        resolvedAt: null,
      });
      prisma.webhookDeliveryFailure.update.mockResolvedValue({
        id: 'dlq-1',
        attemptCount: 2,
        nextRetryAt: new Date(),
        resolvedAt: null,
      });
      fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await service.replayDelivery('dlq-1');

      expect(result.ok).toBe(false);
      expect(result.statusCode).toBeUndefined();
      const updateData = prisma.webhookDeliveryFailure.update.mock.calls[0][0].data;
      expect(updateData.lastStatusCode).toBeNull();
      expect(updateData.lastErrorMessage).toContain('network/timeout');
      expect(updateData.lastErrorMessage).toContain('ECONNREFUSED');
    });

    it('after MAX_ATTEMPTS-1 prior attempts, sets next_retry_at=null (exhausted)', async () => {
      prisma.webhookDeliveryFailure.findUnique.mockResolvedValue({
        id: 'dlq-1',
        eventId: 'env',
        consumer: 'karafiel',
        consumerUrl: 'https://k.example.com',
        eventType: 'payment.succeeded',
        payload: {},
        signatureHeader: 's',
        attemptCount: WEBHOOK_DLQ_MAX_ATTEMPTS - 1,
        resolvedAt: null,
      });
      prisma.webhookDeliveryFailure.update.mockResolvedValue({
        id: 'dlq-1',
        attemptCount: WEBHOOK_DLQ_MAX_ATTEMPTS,
        nextRetryAt: null,
        resolvedAt: null,
      });
      fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => 'err' });

      const result = await service.replayDelivery('dlq-1');

      expect(result.ok).toBe(false);
      const updateData = prisma.webhookDeliveryFailure.update.mock.calls[0][0].data;
      expect(updateData.attemptCount).toBe(WEBHOOK_DLQ_MAX_ATTEMPTS);
      expect(updateData.nextRetryAt).toBeNull();

      // Sentry escalates to 'error' on exhaustion.
      const sentryCall = sentry.captureMessage.mock.calls[0];
      expect(sentryCall[1]).toBe('error');
      expect(sentryCall[2].exhausted).toBe(true);
    });
  });

  // ─── replayDelivery: edge cases ──────────────────────────────────────

  describe('replayDelivery — edge cases', () => {
    it('throws a clear error when the row id does not exist', async () => {
      prisma.webhookDeliveryFailure.findUnique.mockResolvedValue(null);
      await expect(service.replayDelivery('nope')).rejects.toThrow('not found');
    });

    it('returns no-op for an already-resolved row', async () => {
      prisma.webhookDeliveryFailure.findUnique.mockResolvedValue({
        id: 'dlq-1',
        attemptCount: 3,
        nextRetryAt: null,
        resolvedAt: new Date('2026-01-01'),
      });

      const result = await service.replayDelivery('dlq-1');

      expect(result.ok).toBe(true);
      expect(result.resolvedAt).toEqual(new Date('2026-01-01'));
      expect(fetchMock).not.toHaveBeenCalled();
      expect(prisma.webhookDeliveryFailure.update).not.toHaveBeenCalled();
    });

    it('force=true overrides resolved guard so operators can re-deliver historical rows', async () => {
      prisma.webhookDeliveryFailure.findUnique.mockResolvedValue({
        id: 'dlq-1',
        eventId: 'env',
        consumer: 'k',
        consumerUrl: 'https://k.example.com',
        eventType: 'payment.succeeded',
        payload: {},
        signatureHeader: 's',
        attemptCount: 5,
        resolvedAt: new Date('2026-01-01'),
      });
      prisma.webhookDeliveryFailure.update.mockResolvedValue({
        id: 'dlq-1',
        attemptCount: 1,
        nextRetryAt: null,
        resolvedAt: new Date(),
      });
      fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => 'ok' });

      await service.replayDelivery('dlq-1', { force: true });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  // ─── findDueForRetry ─────────────────────────────────────────────────

  describe('findDueForRetry', () => {
    it('queries unresolved rows due now with attempt_count < MAX_ATTEMPTS', async () => {
      const now = new Date('2026-04-26T12:00:00Z');
      prisma.webhookDeliveryFailure.findMany.mockResolvedValue([]);

      await service.findDueForRetry(25, now);

      expect(prisma.webhookDeliveryFailure.findMany).toHaveBeenCalledWith({
        where: {
          resolvedAt: null,
          nextRetryAt: { lte: now },
          attemptCount: { lt: WEBHOOK_DLQ_MAX_ATTEMPTS },
        },
        orderBy: { nextRetryAt: 'asc' },
        take: 25,
      });
    });
  });

  // ─── markResolved + listFailures ─────────────────────────────────────

  describe('markResolved', () => {
    it('stamps resolvedAt and captures the operator reason', async () => {
      prisma.webhookDeliveryFailure.update.mockResolvedValue({
        id: 'dlq-1',
        resolvedAt: new Date(),
      });

      await service.markResolved('dlq-1', { reason: 'CFDI issued manually' });

      const updateData = prisma.webhookDeliveryFailure.update.mock.calls[0][0].data;
      expect(updateData.resolvedAt).toBeInstanceOf(Date);
      expect(updateData.nextRetryAt).toBeNull();
      expect(updateData.lastErrorMessage).toContain('CFDI issued manually');
    });
  });

  describe('listFailures', () => {
    it('defaults to unresolved-only and orders newest-first', async () => {
      prisma.webhookDeliveryFailure.findMany.mockResolvedValue([]);
      prisma.webhookDeliveryFailure.count.mockResolvedValue(0);

      await service.listFailures({});

      const args = prisma.webhookDeliveryFailure.findMany.mock.calls[0][0];
      expect(args.where).toEqual({ resolvedAt: null });
      expect(args.orderBy).toEqual({ createdAt: 'desc' });
      expect(args.take).toBe(50);
      expect(args.skip).toBe(0);
    });

    it('applies consumer + since filters and includeResolved override', async () => {
      prisma.webhookDeliveryFailure.findMany.mockResolvedValue([]);
      prisma.webhookDeliveryFailure.count.mockResolvedValue(0);

      const since = new Date('2026-04-20');
      await service.listFailures({
        consumer: 'karafiel',
        since,
        includeResolved: true,
        limit: 10,
        offset: 20,
      });

      const args = prisma.webhookDeliveryFailure.findMany.mock.calls[0][0];
      expect(args.where).toEqual({ consumer: 'karafiel', createdAt: { gte: since } });
      expect(args.take).toBe(10);
      expect(args.skip).toBe(20);
    });

    it('caps limit at 200 to avoid pathological pages', async () => {
      prisma.webhookDeliveryFailure.findMany.mockResolvedValue([]);
      prisma.webhookDeliveryFailure.count.mockResolvedValue(0);
      await service.listFailures({ limit: 9999 });
      expect(prisma.webhookDeliveryFailure.findMany.mock.calls[0][0].take).toBe(200);
    });
  });

  // ─── isAutoRetryEnabled ──────────────────────────────────────────────

  describe('isAutoRetryEnabled', () => {
    it('returns true when WEBHOOK_DLQ_AUTO_RETRY_ENABLED=true', async () => {
      const c = makeConfigMock({ WEBHOOK_DLQ_AUTO_RETRY_ENABLED: 'true' });
      const s = new WebhookDlqService(prisma as any, c as any);
      expect(s.isAutoRetryEnabled()).toBe(true);
    });

    it('returns false when WEBHOOK_DLQ_AUTO_RETRY_ENABLED=false', async () => {
      const c = makeConfigMock({
        WEBHOOK_DLQ_AUTO_RETRY_ENABLED: 'false',
        NODE_ENV: 'production',
      });
      const s = new WebhookDlqService(prisma as any, c as any);
      expect(s.isAutoRetryEnabled()).toBe(false);
    });

    it('defaults to true in production, false elsewhere', async () => {
      const prod = new WebhookDlqService(
        prisma as any,
        makeConfigMock({ NODE_ENV: 'production' }) as any
      );
      const dev = new WebhookDlqService(
        prisma as any,
        makeConfigMock({ NODE_ENV: 'development' }) as any
      );
      expect(prod.isAutoRetryEnabled()).toBe(true);
      expect(dev.isAutoRetryEnabled()).toBe(false);
    });
  });

  // ─── computeNextRetry helper ─────────────────────────────────────────

  describe('computeNextRetry', () => {
    it('produces 2^attempt minutes of delay', () => {
      const now = new Date('2026-04-26T00:00:00Z');
      const delays: Array<[number, number]> = [
        [1, 2],
        [2, 4],
        [3, 8],
        [4, 16],
        [9, 512],
      ];
      for (const [attempt, expectedMin] of delays) {
        const next = computeNextRetry(attempt, now);
        expect(next.getTime() - now.getTime()).toBe(expectedMin * 60 * 1000);
      }
    });
  });
});
