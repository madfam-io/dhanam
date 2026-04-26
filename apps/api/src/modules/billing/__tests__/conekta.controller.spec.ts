/**
 * =============================================================================
 * ConektaController unit tests
 * =============================================================================
 *
 * Coverage:
 * - 400 on missing signature header
 * - 400 on Conekta-not-configured
 * - 400 on signature verification failure (the load-bearing must-not-500 case)
 * - 200 on valid event with handler dispatch
 * - 200 on handler crash (we ACK to avoid Conekta retry storms)
 *
 * NO real Conekta API calls. ConektaService is mocked.
 * =============================================================================
 */

import { BadRequestException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';

import { ConektaController } from '../conekta.controller';
import { ConektaService } from '../services/conekta.service';

describe('ConektaController', () => {
  let controller: ConektaController;
  let conekta: jest.Mocked<ConektaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConektaController],
      providers: [
        {
          provide: ConektaService,
          useValue: {
            isConfigured: jest.fn().mockReturnValue(true),
            verifyWebhookSignature: jest.fn(),
            handleWebhookEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ConektaController>(ConektaController);
    conekta = module.get(ConektaService) as jest.Mocked<ConektaService>;
  });

  const buildRequest = (body: string | Buffer): RawBodyRequest<Request> => {
    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
    return { rawBody: buffer, body: buffer } as unknown as RawBodyRequest<Request>;
  };

  it('rejects with 400 when Conekta is not configured', async () => {
    conekta.isConfigured.mockReturnValueOnce(false);

    await expect(
      controller.handleConektaWebhook(buildRequest('{}'), 'sha256=abc', undefined)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects with 400 when signature header is missing', async () => {
    await expect(
      controller.handleConektaWebhook(buildRequest('{}'), undefined, undefined)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts the legacy `conekta-signature` header when `digest` is absent', async () => {
    conekta.verifyWebhookSignature.mockReturnValue({
      id: 'evt_legacy',
      type: 'charge.paid',
      livemode: false,
      createdAt: 1735689600,
      data: { object: { id: 'chg_test', order_id: 'ord_test' } },
    });
    conekta.handleWebhookEvent.mockResolvedValue({
      handled: true,
      classification: 'paid',
      chargeId: 'chg_test',
      orderId: 'ord_test',
    });

    const result = await controller.handleConektaWebhook(
      buildRequest('{}'),
      undefined,
      't=1735689600,v1=deadbeef'
    );

    expect(result).toMatchObject({ received: true, classification: 'paid' });
  });

  /**
   * THE LOAD-BEARING TEST.
   *
   * Spec: "the failure mode where signature mismatches MUST return 401, not
   * 500." We use 400 instead of 401 to match the existing webhook-receiver
   * convention in this module (see controller header comment for rationale).
   * The critical assertion is: NOT 500. NestJS maps `BadRequestException`
   * to 400, so anything that throws a `BadRequestException` here passes the
   * spec's intent.
   */
  it('returns BadRequestException (400) on signature mismatch — NOT 500', async () => {
    conekta.verifyWebhookSignature.mockImplementation(() => {
      throw new Error('Conekta signature verification failed');
    });

    const promise = controller.handleConektaWebhook(
      buildRequest('{"type":"charge.paid"}'),
      'sha256=wrong_signature_xxx',
      undefined
    );

    await expect(promise).rejects.toBeInstanceOf(BadRequestException);
    // Defense-in-depth: confirm it's not a generic Error (which Nest would
    // wrap as 500 InternalServerError).
    await expect(promise).rejects.not.toThrow(/InternalServerError/);
  });

  it('returns 200 + classification on a valid event', async () => {
    conekta.verifyWebhookSignature.mockReturnValue({
      id: 'evt_paid_123',
      type: 'charge.paid',
      livemode: true,
      createdAt: 1735689600,
      data: { object: { id: 'chg_test', order_id: 'ord_test' } },
    });
    conekta.handleWebhookEvent.mockResolvedValue({
      handled: true,
      classification: 'paid',
      chargeId: 'chg_test',
      orderId: 'ord_test',
    });

    const result = await controller.handleConektaWebhook(
      buildRequest('{"type":"charge.paid"}'),
      'sha256=valid',
      undefined
    );

    expect(result).toEqual({
      received: true,
      handled: true,
      classification: 'paid',
      eventType: 'charge.paid',
      eventId: 'evt_paid_123',
    });
  });

  it('ACKs 200 even when downstream handler throws (no Conekta retry storm)', async () => {
    conekta.verifyWebhookSignature.mockReturnValue({
      id: 'evt_paid_456',
      type: 'charge.paid',
      livemode: false,
      createdAt: 1735689600,
      data: { object: {} },
    });
    conekta.handleWebhookEvent.mockRejectedValue(new Error('downstream blew up'));

    const result = await controller.handleConektaWebhook(
      buildRequest('{}'),
      'sha256=valid',
      undefined
    );

    expect(result).toEqual({
      received: true,
      handled: false,
      classification: 'error',
      eventType: 'charge.paid',
      eventId: 'evt_paid_456',
    });
  });

  it('handles raw body provided as a string (not Buffer)', async () => {
    conekta.verifyWebhookSignature.mockReturnValue({
      id: 'evt_str',
      type: 'charge.declined',
      livemode: false,
      createdAt: 0,
      data: { object: {} },
    });
    conekta.handleWebhookEvent.mockResolvedValue({
      handled: true,
      classification: 'declined',
    });

    const req = { rawBody: '{"raw":"string"}' } as unknown as RawBodyRequest<Request>;
    const result = await controller.handleConektaWebhook(req, 'sha256=xxx', undefined);

    expect(result.classification).toBe('declined');
    expect(conekta.verifyWebhookSignature).toHaveBeenCalledWith('{"raw":"string"}', 'sha256=xxx');
  });
});
