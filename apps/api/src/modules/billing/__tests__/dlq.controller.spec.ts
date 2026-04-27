/**
 * Integration tests for DlqController. Auth guards are bypassed at the
 * unit-test layer (consistent with the rest of the billing module's
 * controller specs — see credit-billing.controller.spec.ts). Guard
 * behavior itself is covered by the existing roles.guard spec.
 */

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { DlqController } from '../dlq.controller';
import { WebhookDlqService } from '../services/webhook-dlq.service';

describe('DlqController', () => {
  let controller: DlqController;
  let dlq: jest.Mocked<WebhookDlqService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DlqController],
      providers: [
        {
          provide: WebhookDlqService,
          useValue: {
            listFailures: jest.fn(),
            replayDelivery: jest.fn(),
            markResolved: jest.fn(),
          },
        },
      ],
    })
      // Auth guards are exercised by their own dedicated specs
      // (roles.guard.spec, jwt-auth-guard.spec); here we override
      // them so the unit tests focus on controller→service wiring.
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(DlqController);
    dlq = module.get(WebhookDlqService) as jest.Mocked<WebhookDlqService>;
  });

  // ─── GET /v1/billing/dlq ─────────────────────────────────────────────

  describe('GET / (list)', () => {
    it('forwards filters into the service and returns the page', async () => {
      const page = { items: [{ id: 'a' }], total: 1, limit: 50, offset: 0 };
      dlq.listFailures.mockResolvedValue(page as any);

      const result = await controller.list({
        consumer: 'karafiel',
        since: '2026-04-20T00:00:00Z',
        includeResolved: false,
        limit: 50,
        offset: 0,
      });

      expect(result).toEqual(page);
      expect(dlq.listFailures).toHaveBeenCalledWith({
        consumer: 'karafiel',
        since: new Date('2026-04-20T00:00:00Z'),
        includeResolved: false,
        limit: 50,
        offset: 0,
      });
    });

    it('passes undefined since when omitted', async () => {
      dlq.listFailures.mockResolvedValue({ items: [], total: 0, limit: 50, offset: 0 } as any);

      await controller.list({});

      expect(dlq.listFailures).toHaveBeenCalledWith({
        consumer: undefined,
        since: undefined,
        includeResolved: undefined,
        limit: undefined,
        offset: undefined,
      });
    });
  });

  // ─── POST /v1/billing/dlq/:id/replay ─────────────────────────────────

  describe('POST /:id/replay', () => {
    it('invokes service with force=true and returns redacted result', async () => {
      const now = new Date();
      dlq.replayDelivery.mockResolvedValue({
        failureId: 'dlq-1',
        ok: true,
        statusCode: 200,
        attemptCount: 1,
        nextRetryAt: null,
        resolvedAt: now,
        // Service may include error context — controller MUST strip it.
        errorMessage: 'should not leak',
      } as any);

      const result = await controller.replay('dlq-1');

      expect(dlq.replayDelivery).toHaveBeenCalledWith('dlq-1', { force: true });
      expect(result).toEqual({
        id: 'dlq-1',
        ok: true,
        statusCode: 200,
        attemptCount: 1,
        nextRetryAt: null,
        resolvedAt: now,
      });
      // Critical: error context is NOT included in the HTTP response so
      // the admin endpoint cannot leak downstream HTML / cookies / headers.
      expect((result as any).errorMessage).toBeUndefined();
    });

    it('returns the failed-replay result without throwing (so admin sees the next_retry_at)', async () => {
      const next = new Date();
      dlq.replayDelivery.mockResolvedValue({
        failureId: 'dlq-1',
        ok: false,
        statusCode: 503,
        attemptCount: 1,
        nextRetryAt: next,
        resolvedAt: null,
        errorMessage: 'consumer responded 503',
      } as any);

      const result = await controller.replay('dlq-1');

      expect(result.ok).toBe(false);
      expect(result.statusCode).toBe(503);
      expect(result.nextRetryAt).toBe(next);
      expect((result as any).errorMessage).toBeUndefined();
    });

    it('translates service "not found" error into 404 NotFoundException', async () => {
      dlq.replayDelivery.mockRejectedValue(new Error('webhook_delivery_failure xyz not found'));

      await expect(controller.replay('xyz')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('does not leak unexpected service errors — collapses to generic 404', async () => {
      dlq.replayDelivery.mockRejectedValue(new Error('internal: stripe customer secret xyz'));

      await expect(controller.replay('a')).rejects.toBeInstanceOf(NotFoundException);
      // Verify the message does NOT echo the secret.
      try {
        await controller.replay('a');
      } catch (err) {
        expect((err as Error).message).not.toContain('stripe customer secret');
      }
    });
  });

  // ─── POST /v1/billing/dlq/:id/resolve ────────────────────────────────

  describe('POST /:id/resolve', () => {
    it('marks resolved with operator-supplied reason', async () => {
      const now = new Date();
      dlq.markResolved.mockResolvedValue({ id: 'dlq-1', resolvedAt: now } as any);

      const result = await controller.resolve('dlq-1', { reason: 'CFDI issued by hand' });

      expect(dlq.markResolved).toHaveBeenCalledWith('dlq-1', {
        reason: 'CFDI issued by hand',
      });
      expect(result).toEqual({ id: 'dlq-1', resolvedAt: now });
    });

    it('accepts a missing reason (manual resolution without notes)', async () => {
      dlq.markResolved.mockResolvedValue({ id: 'dlq-1', resolvedAt: new Date() } as any);

      await controller.resolve('dlq-1', {});

      expect(dlq.markResolved).toHaveBeenCalledWith('dlq-1', { reason: undefined });
    });

    it('returns 404 when the row id does not exist', async () => {
      dlq.markResolved.mockRejectedValue(new Error('Record to update not found'));

      await expect(controller.resolve('missing', {})).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
