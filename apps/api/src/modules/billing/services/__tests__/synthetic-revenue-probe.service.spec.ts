import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../../core/prisma/prisma.service';
import { SyntheticRevenueProbeService } from '../synthetic-revenue-probe.service';

// ─── helpers ────────────────────────────────────────────────────────────

function makePrismaMock() {
  return {
    space: {
      findFirst: jest.fn(),
    },
    billingEvent: {
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
}

function makeConfigMock(overrides: Record<string, string | undefined> = {}) {
  const defaults: Record<string, string | undefined> = {
    MADFAM_EVENTS_WEBHOOK_SECRET: 'test-secret',
    SYNTHETIC_PROBE_ENABLED: 'true',
    SYNTHETIC_PROBE_BASE_URL: 'https://api.example.test',
    PRODUCT_WEBHOOK_URLS: '',
  };
  const merged = { ...defaults, ...overrides };
  return {
    get: jest.fn((key: string, def?: unknown) => {
      const v = merged[key];
      if (v === undefined) return def;
      return v;
    }),
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function textResponse(status: number, body: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      throw new Error('not json');
    },
    text: async () => body,
  } as unknown as Response;
}

// ─── suite ──────────────────────────────────────────────────────────────

describe('SyntheticRevenueProbeService', () => {
  let service: SyntheticRevenueProbeService;
  let prisma: ReturnType<typeof makePrismaMock>;
  let config: ReturnType<typeof makeConfigMock>;
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    prisma = makePrismaMock();
    config = makeConfigMock();

    fetchMock = jest.fn();
    (globalThis as unknown as { fetch: jest.Mock }).fetch = fetchMock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyntheticRevenueProbeService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(SyntheticRevenueProbeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isEnabled', () => {
    it('returns true when SYNTHETIC_PROBE_ENABLED=true', () => {
      expect(service.isEnabled()).toBe(true);
    });

    it('returns false when flag is missing', async () => {
      const localConfig = makeConfigMock({ SYNTHETIC_PROBE_ENABLED: undefined });
      const m: TestingModule = await Test.createTestingModule({
        providers: [
          SyntheticRevenueProbeService,
          { provide: PrismaService, useValue: prisma },
          { provide: ConfigService, useValue: localConfig },
        ],
      }).compile();
      expect(m.get(SyntheticRevenueProbeService).isEnabled()).toBe(false);
    });

    it('returns false when flag is the string "false"', async () => {
      const localConfig = makeConfigMock({ SYNTHETIC_PROBE_ENABLED: 'false' });
      const m: TestingModule = await Test.createTestingModule({
        providers: [
          SyntheticRevenueProbeService,
          { provide: PrismaService, useValue: prisma },
          { provide: ConfigService, useValue: localConfig },
        ],
      }).compile();
      expect(m.get(SyntheticRevenueProbeService).isEnabled()).toBe(false);
    });

    it('accepts "1" as true (k8s ConfigMap convention)', async () => {
      const localConfig = makeConfigMock({ SYNTHETIC_PROBE_ENABLED: '1' });
      const m: TestingModule = await Test.createTestingModule({
        providers: [
          SyntheticRevenueProbeService,
          { provide: PrismaService, useValue: prisma },
          { provide: ConfigService, useValue: localConfig },
        ],
      }).compile();
      expect(m.get(SyntheticRevenueProbeService).isEnabled()).toBe(true);
    });
  });

  describe('runProbe — config preflight', () => {
    it('fails with stage=config_check when MADFAM_EVENTS_WEBHOOK_SECRET is missing', async () => {
      const localConfig = makeConfigMock({ MADFAM_EVENTS_WEBHOOK_SECRET: undefined });
      const m: TestingModule = await Test.createTestingModule({
        providers: [
          SyntheticRevenueProbeService,
          { provide: PrismaService, useValue: prisma },
          { provide: ConfigService, useValue: localConfig },
        ],
      }).compile();
      const svc = m.get(SyntheticRevenueProbeService);

      const r = await svc.runProbe();

      expect(r.ok).toBe(false);
      expect(r.stages[0]?.stage).toBe('config_check');
      expect(r.stages[0]?.status).toBe('failed');
      expect(r.stages[0]?.error).toMatch(/MADFAM_EVENTS_WEBHOOK_SECRET/);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('runProbe — happy path (recorded)', () => {
    it('signs the request, verifies persistence via DB and HTTP, and returns ok', async () => {
      prisma.space.findFirst.mockResolvedValue({ id: 'space-real-123' });
      prisma.billingEvent.findUnique.mockResolvedValue({
        id: 'be-1',
        status: 'succeeded',
      });

      // POST receiver returns recorded; GET probe endpoint returns 200
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(200, {
            billing_event_id: 'be-1',
            status: 'recorded',
            amount_mxn_cents: 1,
            tenant_id: 'user-1',
          })
        )
        .mockResolvedValueOnce(
          jsonResponse(200, {
            id: 'be-1',
            status: 'succeeded',
            amount_mxn_cents: 1,
            tenant_id: 'user-1',
          })
        );

      const r = await service.runProbe();

      expect(r.ok).toBe(true);
      expect(r.stages.map((s) => s.stage)).toEqual([
        'config_check',
        'self_fire',
        'verify_persisted',
        'verify_consumers',
      ]);
      expect(r.stages.find((s) => s.stage === 'self_fire')?.status).toBe('ok');
      expect(r.stages.find((s) => s.stage === 'verify_persisted')?.status).toBe('ok');

      // Self-fire used the real Space id as organization_id
      const postCall = fetchMock.mock.calls[0];
      expect(postCall[0]).toBe('https://api.example.test/v1/billing/madfam-events');
      expect(postCall[1].method).toBe('POST');
      const body = JSON.parse(postCall[1].body as string);
      expect(body.organization_id).toBe('space-real-123');
      expect(body.provider).toBe('probe');
      expect(body.event_id).toMatch(/^probe-\d+-[0-9a-f]{8}$/);
      expect(body.amount_minor).toBe(1);
      expect(body.currency).toBe('MXN');

      // Signature header is present and parses
      const sigHeader = postCall[1].headers['x-madfam-signature'] as string;
      expect(sigHeader).toMatch(/^t=\d+,v1=[0-9a-f]{64}$/);

      // GET verify hit the probe lookup endpoint
      const getCall = fetchMock.mock.calls[1];
      expect(getCall[0]).toMatch(
        /^https:\/\/api\.example\.test\/v1\/probe\/billing-events\/probe-/
      );
      expect(getCall[1].method).toBe('GET');
    });
  });

  describe('runProbe — accepted_unlinked path', () => {
    it('marks verify_persisted as degraded (not failed) when receiver returns accepted_unlinked', async () => {
      prisma.space.findFirst.mockResolvedValue(null); // forces synthetic UUID
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, {
          billing_event_id: null,
          status: 'accepted_unlinked',
          amount_mxn_cents: 1,
          tenant_id: null,
        })
      );

      const r = await service.runProbe();

      expect(r.ok).toBe(true); // degraded != failed
      const verify = r.stages.find((s) => s.stage === 'verify_persisted');
      expect(verify?.status).toBe('degraded');
      expect(verify?.detail).toContain('accepted_unlinked');
      // No second fetch — we skipped the GET probe
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(prisma.billingEvent.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('runProbe — receiver failure modes', () => {
    it('reports failure when receiver returns 401', async () => {
      prisma.space.findFirst.mockResolvedValue({ id: 'space-1' });
      fetchMock.mockResolvedValueOnce(textResponse(401, 'invalid signature'));

      const r = await service.runProbe();

      expect(r.ok).toBe(false);
      const fire = r.stages.find((s) => s.stage === 'self_fire');
      expect(fire?.status).toBe('failed');
      expect(fire?.error).toMatch(/http_401/);
    });

    it('reports failure when fetch itself throws (network down)', async () => {
      prisma.space.findFirst.mockResolvedValue({ id: 'space-1' });
      fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const r = await service.runProbe();

      expect(r.ok).toBe(false);
      const fire = r.stages.find((s) => s.stage === 'self_fire');
      expect(fire?.status).toBe('failed');
      expect(fire?.error).toMatch(/fetch_failed.*ECONNREFUSED/);
    });

    it('reports failure when receiver returns an unexpected status string', async () => {
      prisma.space.findFirst.mockResolvedValue({ id: 'space-1' });
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, {
          billing_event_id: null,
          status: 'oops_unknown',
        })
      );

      const r = await service.runProbe();

      expect(r.ok).toBe(false);
      const fire = r.stages.find((s) => s.stage === 'self_fire');
      expect(fire?.status).toBe('failed');
      expect(fire?.error).toMatch(/unexpected_receiver_status: oops_unknown/);
    });

    it('reports failure when receiver returns duplicate on a fresh event_id', async () => {
      prisma.space.findFirst.mockResolvedValue({ id: 'space-1' });
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, {
          billing_event_id: 'existing-1',
          status: 'duplicate',
        })
      );

      const r = await service.runProbe();

      expect(r.ok).toBe(false);
      const verify = r.stages.find((s) => s.stage === 'verify_persisted');
      expect(verify?.status).toBe('failed');
      expect(verify?.error).toMatch(/duplicate_on_fresh_event_id/);
    });

    it('reports failure when DB row is missing within deadline (timeout or stage failure)', async () => {
      // Uses fake timers to advance past both the 60s verify deadline AND the
      // 30s overall ceiling without taking 30 real seconds. Either failure
      // mode is acceptable evidence the probe doesn't hang indefinitely:
      // the inner verify_persisted loop hits its 60s budget OR the outer
      // 30s deadline trips first — both produce ok=false with a stage that
      // points the operator at the missing DB row.
      jest.useFakeTimers();
      prisma.space.findFirst.mockResolvedValue({ id: 'space-1' });
      prisma.billingEvent.findUnique.mockResolvedValue(null);

      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, { billing_event_id: 'be-1', status: 'recorded' })
      );

      const promise = service.runProbe();
      // Advance past both deadlines (60s verify + 30s overall ceiling).
      await jest.advanceTimersByTimeAsync(70_000);
      const r = await promise;

      expect(r.ok).toBe(false);
      // Whichever deadline trips first, the failure is one of:
      //   verify_persisted:failed/persisted_row_not_found_within_deadline
      //   timeout:failed/probe_deadline_exceeded_30000ms
      const failingStage = r.stages.find((s) => s.status === 'failed');
      expect(failingStage).toBeDefined();
      expect(['verify_persisted', 'timeout']).toContain(failingStage?.stage);
      jest.useRealTimers();
    });

    it('reports failure when DB has the row but the GET endpoint 404s', async () => {
      prisma.space.findFirst.mockResolvedValue({ id: 'space-1' });
      prisma.billingEvent.findUnique.mockResolvedValue({ id: 'be-1', status: 'succeeded' });

      fetchMock
        .mockResolvedValueOnce(jsonResponse(200, { billing_event_id: 'be-1', status: 'recorded' }))
        .mockResolvedValueOnce(textResponse(404, 'not found'));

      const r = await service.runProbe();

      expect(r.ok).toBe(false);
      const verify = r.stages.find((s) => s.stage === 'verify_persisted');
      expect(verify?.status).toBe('failed');
      expect(verify?.error).toMatch(/db_ok_http_failed.*http_404/);
    });
  });

  describe('runProbe — verify_consumers stage', () => {
    it('skips when PRODUCT_WEBHOOK_URLS is empty', async () => {
      prisma.space.findFirst.mockResolvedValue({ id: 'space-1' });
      prisma.billingEvent.findUnique.mockResolvedValue({ id: 'be-1', status: 'succeeded' });
      fetchMock
        .mockResolvedValueOnce(jsonResponse(200, { billing_event_id: 'be-1', status: 'recorded' }))
        .mockResolvedValueOnce(jsonResponse(200, { status: 'succeeded' }));

      const r = await service.runProbe();
      const c = r.stages.find((s) => s.stage === 'verify_consumers');
      expect(c?.status).toBe('skipped');
    });

    it('marks consumers ok when all /health calls return 200', async () => {
      const localConfig = makeConfigMock({
        PRODUCT_WEBHOOK_URLS:
          'karafiel:https://api.karafiel.mx/api/v1/webhooks/dhanam,tezca:https://api.tezca.mx/v1/webhooks/dhanam',
      });
      const m: TestingModule = await Test.createTestingModule({
        providers: [
          SyntheticRevenueProbeService,
          { provide: PrismaService, useValue: prisma },
          { provide: ConfigService, useValue: localConfig },
        ],
      }).compile();
      const svc = m.get(SyntheticRevenueProbeService);

      prisma.space.findFirst.mockResolvedValue({ id: 'space-1' });
      prisma.billingEvent.findUnique.mockResolvedValue({ id: 'be-1', status: 'succeeded' });

      fetchMock
        // self-fire
        .mockResolvedValueOnce(jsonResponse(200, { billing_event_id: 'be-1', status: 'recorded' }))
        // GET verify
        .mockResolvedValueOnce(jsonResponse(200, { status: 'succeeded' }))
        // karafiel /health
        .mockResolvedValueOnce(jsonResponse(200, { ok: true }))
        // tezca /health
        .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

      const r = await svc.runProbe();

      const c = r.stages.find((s) => s.stage === 'verify_consumers');
      expect(c?.status).toBe('ok');
      expect(c?.detail).toContain('karafiel=200');
      expect(c?.detail).toContain('tezca=200');

      // Health URLs should be `<origin>/health`
      const karafielCall = fetchMock.mock.calls[2];
      expect(karafielCall[0]).toBe('https://api.karafiel.mx/health');
      const tezcaCall = fetchMock.mock.calls[3];
      expect(tezcaCall[0]).toBe('https://api.tezca.mx/health');
    });

    it('marks consumers degraded (not failed) when one consumer is down', async () => {
      const localConfig = makeConfigMock({
        PRODUCT_WEBHOOK_URLS: 'karafiel:https://api.karafiel.mx/api/v1/webhooks/dhanam',
      });
      const m: TestingModule = await Test.createTestingModule({
        providers: [
          SyntheticRevenueProbeService,
          { provide: PrismaService, useValue: prisma },
          { provide: ConfigService, useValue: localConfig },
        ],
      }).compile();
      const svc = m.get(SyntheticRevenueProbeService);

      prisma.space.findFirst.mockResolvedValue({ id: 'space-1' });
      prisma.billingEvent.findUnique.mockResolvedValue({ id: 'be-1', status: 'succeeded' });

      fetchMock
        .mockResolvedValueOnce(jsonResponse(200, { billing_event_id: 'be-1', status: 'recorded' }))
        .mockResolvedValueOnce(jsonResponse(200, { status: 'succeeded' }))
        .mockResolvedValueOnce(textResponse(503, 'down'));

      const r = await svc.runProbe();

      // Overall still ok — consumer health is informational
      expect(r.ok).toBe(true);
      const c = r.stages.find((s) => s.stage === 'verify_consumers');
      expect(c?.status).toBe('degraded');
      expect(c?.detail).toContain('karafiel=503');
    });
  });

  describe('cleanupOldProbeEvents', () => {
    it('deletes BillingEvent rows older than 24h with stripeEventId starting with probe-', async () => {
      prisma.billingEvent.deleteMany.mockResolvedValue({ count: 7 });

      const deleted = await service.cleanupOldProbeEvents();

      expect(deleted).toBe(7);
      const call = prisma.billingEvent.deleteMany.mock.calls[0][0];
      expect(call.where.stripeEventId).toEqual({ startsWith: 'probe-' });
      expect(call.where.createdAt.lt).toBeInstanceOf(Date);
      const cutoff = call.where.createdAt.lt as Date;
      const deltaMs = Date.now() - cutoff.getTime();
      // Cutoff is approximately 24h ago (allow 5s slack)
      expect(deltaMs).toBeGreaterThan(24 * 60 * 60 * 1000 - 5000);
      expect(deltaMs).toBeLessThan(24 * 60 * 60 * 1000 + 5000);
    });

    it('returns 0 when nothing to clean up', async () => {
      prisma.billingEvent.deleteMany.mockResolvedValue({ count: 0 });
      const deleted = await service.cleanupOldProbeEvents();
      expect(deleted).toBe(0);
    });
  });
});
