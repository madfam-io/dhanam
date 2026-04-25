import { Test, TestingModule } from '@nestjs/testing';

import {
  BusinessRuleException,
  ProviderException,
  ValidationException,
} from '../../../core/exceptions/domain-exceptions';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisFxCacheService } from '../cache/redis-fx-cache.service';
import { FxRateType } from '../dto/fx-rate.dto';
import { FX_PROVIDER_CHAIN, FxService } from '../fx.service';
import { FxProvider, FxProviderRate } from '../providers/fx-provider.interface';

/**
 * RFC 0011 Phase 1 service-level tests.
 *
 * Coverage required by the task spec:
 *   - provider chain failover
 *   - rate-type semantics (spot ≠ dof ≠ settled)
 *   - cache hit/miss
 *   - error envelope
 */

function makeProvider(opts: {
  name: string;
  supports: FxRateType[];
  result?: FxProviderRate | null;
  shouldThrow?: boolean;
}): jest.Mocked<FxProvider> {
  const supportsSet = new Set(opts.supports);
  return {
    name: opts.name,
    supports: jest.fn((t: FxRateType) => supportsSet.has(t)),
    getRate: jest.fn(async () => {
      if (opts.shouldThrow) throw new Error(`${opts.name}: simulated upstream failure`);
      return opts.result ?? null;
    }),
  } as unknown as jest.Mocked<FxProvider>;
}

function rateOf(overrides: Partial<FxProviderRate> = {}): FxProviderRate {
  const observedAt = overrides.observed_at ?? new Date('2026-04-25T18:14:32Z');
  return {
    from: 'USD',
    to: 'MXN',
    rate: '20.5103',
    provider_id: 'oer:2026-04-25T18:14:00Z',
    observed_at: observedAt,
    effective_at: overrides.effective_at ?? observedAt,
    source: 'openexchangerates',
    ...overrides,
  };
}

function makeCacheMock(): jest.Mocked<RedisFxCacheService> {
  return {
    buildKey: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<RedisFxCacheService>;
}

function makePrismaMock() {
  return {
    fxRateObservation: {
      create: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
    fxRatePublication: {
      upsert: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    fxRateOverride: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
  };
}

describe('FxService', () => {
  let service: FxService;
  let cache: jest.Mocked<RedisFxCacheService>;
  let prisma: ReturnType<typeof makePrismaMock>;
  let primary: jest.Mocked<FxProvider>;
  let secondary: jest.Mocked<FxProvider>;
  let dofProvider: jest.Mocked<FxProvider>;

  async function buildService(chain: FxProvider[]) {
    cache = makeCacheMock();
    prisma = makePrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FxService,
        { provide: RedisFxCacheService, useValue: cache },
        { provide: PrismaService, useValue: prisma },
        { provide: FX_PROVIDER_CHAIN, useValue: chain },
      ],
    }).compile();
    service = module.get(FxService);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Cache hit/miss ──────────────────────────────────────────────────────

  describe('cache behavior', () => {
    it('returns cached value without calling any provider on hit', async () => {
      primary = makeProvider({ name: 'primary', supports: [FxRateType.spot], result: rateOf() });
      await buildService([primary]);
      cache.get.mockResolvedValueOnce(rateOf({ source: 'cached' }));

      const r = await service.getRate({ from: 'USD', to: 'MXN', type: FxRateType.spot });

      expect(r.rate).toBe('20.5103');
      expect(r.source).toBe('cached');
      expect(primary.getRate).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('on cache miss, hits provider chain and caches the result', async () => {
      primary = makeProvider({ name: 'primary', supports: [FxRateType.spot], result: rateOf() });
      await buildService([primary]);

      const r = await service.getRate({ from: 'USD', to: 'MXN', type: FxRateType.spot });

      expect(r.rate).toBe('20.5103');
      expect(primary.getRate).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledWith(
        FxRateType.spot,
        expect.objectContaining({ rate: '20.5103' }),
        undefined
      );
    });

    it('writes an observation row on every successful chain call', async () => {
      primary = makeProvider({ name: 'primary', supports: [FxRateType.spot], result: rateOf() });
      await buildService([primary]);

      await service.getRate({ from: 'USD', to: 'MXN', type: FxRateType.spot });

      expect(prisma.fxRateObservation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fromCurrency: 'USD',
          toCurrency: 'MXN',
          rateType: FxRateType.spot,
          rate: '20.5103',
          source: 'openexchangerates',
        }),
      });
    });
  });

  // ── Provider chain failover ─────────────────────────────────────────────

  describe('provider chain failover', () => {
    it('falls through to secondary when primary throws', async () => {
      primary = makeProvider({ name: 'primary', supports: [FxRateType.spot], shouldThrow: true });
      secondary = makeProvider({
        name: 'secondary',
        supports: [FxRateType.spot],
        result: rateOf({ source: 'exchangerate_host', provider_id: 'fallback' }),
      });
      await buildService([primary, secondary]);

      const r = await service.getRate({ from: 'USD', to: 'MXN', type: FxRateType.spot });

      expect(primary.getRate).toHaveBeenCalledTimes(1);
      expect(secondary.getRate).toHaveBeenCalledTimes(1);
      expect(r.source).toBe('exchangerate_host');
      expect(r.provenance.fallback_chain_used).toBe(true);
    });

    it('falls through when primary returns null (unsupported pair)', async () => {
      primary = makeProvider({ name: 'primary', supports: [FxRateType.spot], result: null });
      secondary = makeProvider({
        name: 'secondary',
        supports: [FxRateType.spot],
        result: rateOf({ source: 'exchangerate_host' }),
      });
      await buildService([primary, secondary]);

      const r = await service.getRate({ from: 'USD', to: 'MXN', type: FxRateType.spot });

      expect(r.source).toBe('exchangerate_host');
    });

    it('skips providers that do not support the requested rate type', async () => {
      // OER (spot only) should be skipped when caller asks for DOF; Banxico SIE (DOF only) should serve.
      primary = makeProvider({ name: 'oer', supports: [FxRateType.spot], result: rateOf() });
      dofProvider = makeProvider({
        name: 'banxico_sie',
        supports: [FxRateType.dof],
        result: rateOf({
          source: 'banxico_sie',
          provider_id: 'banxico_sie:SF60653:25/04/2026',
          rate: '20.4521',
        }),
      });
      await buildService([primary, dofProvider]);

      const r = await service.getRate({ from: 'USD', to: 'MXN', type: FxRateType.dof });

      expect(primary.getRate).not.toHaveBeenCalled();
      expect(dofProvider.getRate).toHaveBeenCalledTimes(1);
      expect(r.source).toBe('banxico_sie');
      expect(r.rate).toBe('20.4521');
      expect(r.type).toBe(FxRateType.dof);
    });

    it('throws ProviderException when chain is fully exhausted', async () => {
      primary = makeProvider({ name: 'primary', supports: [FxRateType.spot], shouldThrow: true });
      secondary = makeProvider({
        name: 'secondary',
        supports: [FxRateType.spot],
        shouldThrow: true,
      });
      await buildService([primary, secondary]);

      await expect(
        service.getRate({ from: 'USD', to: 'MXN', type: FxRateType.spot })
      ).rejects.toBeInstanceOf(ProviderException);
    });

    it('serves last_known_good from DB when chain exhausted and allow_stale=true', async () => {
      primary = makeProvider({ name: 'primary', supports: [FxRateType.spot], shouldThrow: true });
      await buildService([primary]);
      prisma.fxRateObservation.findFirst.mockResolvedValueOnce({
        id: 'obs-1',
        fromCurrency: 'USD',
        toCurrency: 'MXN',
        rateType: FxRateType.spot,
        rate: '20.4400',
        source: 'openexchangerates',
        providerId: 'oer:old',
        paymentId: null,
        observedAt: new Date('2026-04-24T18:14:32Z'),
        effectiveAt: new Date('2026-04-24T18:14:32Z'),
        createdAt: new Date(),
      });

      const r = await service.getRate({
        from: 'USD',
        to: 'MXN',
        type: FxRateType.spot,
        allowStale: true,
      });

      expect(r.rate).toBe('20.4400');
      expect(r.provenance.fallback_chain_used).toBe(true);
      expect(r.provenance.note).toMatch(/last_known_good/);
    });
  });

  // ── Rate-type semantics ────────────────────────────────────────────────

  describe('rate-type semantics', () => {
    it('persists DOF rows to fx_rate_publications (one canonical per day)', async () => {
      dofProvider = makeProvider({
        name: 'banxico_sie',
        supports: [FxRateType.dof],
        result: rateOf({
          source: 'banxico_sie',
          provider_id: 'banxico_sie:SF60653:25/04/2026',
          rate: '20.4521',
          effective_at: new Date('2026-04-25T18:00:00Z'),
        }),
      });
      await buildService([dofProvider]);

      await service.getRate({ from: 'USD', to: 'MXN', type: FxRateType.dof });

      expect(prisma.fxRatePublication.upsert).toHaveBeenCalledTimes(1);
      const call = prisma.fxRatePublication.upsert.mock.calls[0][0];
      expect(call.where.fromCurrency_toCurrency_effectiveDate).toEqual({
        fromCurrency: 'USD',
        toCurrency: 'MXN',
        effectiveDate: new Date('2026-04-25T00:00:00.000Z'),
      });
      expect(call.create.rate).toBe('20.4521');
    });

    it('does NOT write to fx_rate_publications for type=spot', async () => {
      primary = makeProvider({ name: 'primary', supports: [FxRateType.spot], result: rateOf() });
      await buildService([primary]);

      await service.getRate({ from: 'USD', to: 'MXN', type: FxRateType.spot });

      expect(prisma.fxRatePublication.upsert).not.toHaveBeenCalled();
    });

    it('type=settled returns the recorded payment rate from the observations table', async () => {
      await buildService([]); // no providers needed for settled
      prisma.fxRateObservation.findFirst.mockResolvedValueOnce({
        id: 'obs-99',
        fromCurrency: 'USD',
        toCurrency: 'MXN',
        rateType: FxRateType.settled,
        rate: '20.5000',
        source: 'stripe_mx',
        providerId: 'stripe_mx:pi_abc123',
        paymentId: 'pi_abc123',
        observedAt: new Date('2026-04-22T12:00:00Z'),
        effectiveAt: new Date('2026-04-22T12:00:00Z'),
        createdAt: new Date(),
      });

      const r = await service.getRate({
        from: 'USD',
        to: 'MXN',
        type: FxRateType.settled,
        paymentId: 'pi_abc123',
      });

      expect(r.type).toBe(FxRateType.settled);
      expect(r.rate).toBe('20.5000');
      expect(prisma.fxRateObservation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            rateType: FxRateType.settled,
            paymentId: 'pi_abc123',
          }),
        })
      );
    });

    it('type=settled with no row → BusinessRuleException (404 envelope)', async () => {
      await buildService([]);
      prisma.fxRateObservation.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.getRate({
          from: 'USD',
          to: 'MXN',
          type: FxRateType.settled,
          paymentId: 'pi_unknown',
        })
      ).rejects.toBeInstanceOf(BusinessRuleException);
    });

    it('type=settled requires payment_id', async () => {
      await buildService([]);

      await expect(
        service.getRate({ from: 'USD', to: 'MXN', type: FxRateType.settled })
      ).rejects.toBeInstanceOf(ValidationException);
    });

    it('manual override beats the provider chain', async () => {
      primary = makeProvider({ name: 'primary', supports: [FxRateType.spot], result: rateOf() });
      await buildService([primary]);
      prisma.fxRateOverride.findFirst.mockResolvedValueOnce({
        id: 'ovr-1',
        fromCurrency: 'USD',
        toCurrency: 'MXN',
        rateType: FxRateType.spot,
        rate: '21.0000',
        rationale: 'incident X',
        issuedBy: 'janua-sub-1',
        approvedBy: 'janua-sub-2',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        revokedBy: null,
        createdAt: new Date(),
      });

      const r = await service.getRate({ from: 'USD', to: 'MXN', type: FxRateType.spot });

      expect(r.rate).toBe('21.0000');
      expect(r.source).toBe('manual_override');
      expect(primary.getRate).not.toHaveBeenCalled();
    });
  });

  // ── Error envelope ──────────────────────────────────────────────────────

  describe('error envelope', () => {
    it('rejects non-ISO-4217 currency codes via ValidationException', async () => {
      await buildService([]);

      await expect(
        service.getRate({ from: 'USDD', to: 'MXN', type: FxRateType.spot })
      ).rejects.toBeInstanceOf(ValidationException);
    });

    it('batch endpoint rejects type=settled', async () => {
      await buildService([]);
      await expect(
        service.getRatesBatch({
          base: 'USD',
          targets: ['MXN'],
          type: FxRateType.settled,
        })
      ).rejects.toBeInstanceOf(ValidationException);
    });

    it('history endpoint rejects from_date > to_date', async () => {
      await buildService([]);
      await expect(
        service.getHistory({
          from: 'USD',
          to: 'MXN',
          type: FxRateType.spot,
          fromDate: new Date('2026-04-25'),
          toDate: new Date('2026-04-01'),
        })
      ).rejects.toBeInstanceOf(ValidationException);
    });

    it('chain-exhausted ProviderException carries retryable + retryAfterMs', async () => {
      primary = makeProvider({ name: 'primary', supports: [FxRateType.spot], shouldThrow: true });
      await buildService([primary]);

      const err = await service
        .getRate({ from: 'USD', to: 'MXN', type: FxRateType.spot })
        .catch((e) => e);

      expect(err).toBeInstanceOf(ProviderException);
      expect((err as ProviderException).retryable).toBe(true);
      expect((err as ProviderException).retryAfterMs).toBe(30_000);
    });
  });

  // ── Batch + history smoke ───────────────────────────────────────────────

  describe('batch + history', () => {
    it('batch gathers per-target rates and skips failures silently', async () => {
      primary = makeProvider({
        name: 'primary',
        supports: [FxRateType.spot],
        // First call ok, second call throws — controlled below
        result: rateOf(),
      });
      await buildService([primary]);

      // Simulate per-call: first succeeds, second throws
      (primary.getRate as jest.Mock)
        .mockResolvedValueOnce(rateOf({ to: 'MXN', rate: '20.5103' }))
        .mockRejectedValueOnce(new Error('upstream fail for EUR'));

      const r = await service.getRatesBatch({
        base: 'USD',
        targets: ['MXN', 'EUR'],
        type: FxRateType.spot,
      });

      expect(Object.keys(r.rates)).toContain('MXN');
      expect(r.rates.MXN.rate).toBe('20.5103');
      expect(r.rates.EUR).toBeUndefined();
    });

    it('history reads from publications when type=dof', async () => {
      await buildService([]);
      prisma.fxRatePublication.findMany.mockResolvedValueOnce([
        {
          id: 'pub-1',
          fromCurrency: 'USD',
          toCurrency: 'MXN',
          effectiveDate: new Date('2026-04-23T00:00:00Z'),
          rate: '20.4521',
          source: 'banxico_sie',
          providerId: 'banxico_sie:SF60653:23/04/2026',
          publishedAt: new Date('2026-04-23T18:00:00Z'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const r = await service.getHistory({
        from: 'USD',
        to: 'MXN',
        type: FxRateType.dof,
        fromDate: new Date('2026-04-01'),
        toDate: new Date('2026-04-25'),
      });

      expect(r.count).toBe(1);
      expect(r.entries[0].rate).toBe('20.4521');
      expect(prisma.fxRatePublication.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.fxRateObservation.findMany).not.toHaveBeenCalled();
    });

    it('history reads from observations when type=spot', async () => {
      await buildService([]);
      prisma.fxRateObservation.findMany.mockResolvedValueOnce([]);

      const r = await service.getHistory({
        from: 'USD',
        to: 'MXN',
        type: FxRateType.spot,
        fromDate: new Date('2026-04-24'),
        toDate: new Date('2026-04-25'),
      });

      expect(r.count).toBe(0);
      expect(prisma.fxRateObservation.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.fxRatePublication.findMany).not.toHaveBeenCalled();
    });
  });
});
