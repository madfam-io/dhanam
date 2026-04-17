import * as crypto from 'crypto';

/**
 * Pure MADFAM ecosystem signature verifier.
 *
 * Split out of the controller so tests can exercise every edge case
 * without spinning up a Nest test module.
 *
 * Signature format — identical to what `@routecraft/payments`'s
 * `signBody()` produces:
 *
 *     x-madfam-signature: t=<unix-seconds>,v1=<hex-hmac-sha256>
 *
 * where the HMAC is computed over `"${ts}.${rawBody}"`. The format
 * mirrors Stripe's webhook signatures so a caller familiar with one is
 * productive on the other immediately.
 */

export const DEFAULT_REPLAY_WINDOW_SECONDS = 5 * 60;

export type SignatureFailureReason =
  | 'missing_secret'
  | 'missing_signature_header'
  | 'malformed_signature_header'
  | 'non_numeric_timestamp'
  | 'replay_out_of_window'
  | 'signature_mismatch';

export interface SignatureResult {
  ok: boolean;
  reason?: SignatureFailureReason;
}

export function verifyMadfamSignature(
  rawBody: string,
  signatureHeader: string | undefined | null,
  secret: string,
  opts: { nowSec?: number; replayWindowSec?: number } = {}
): SignatureResult {
  if (!secret) return { ok: false, reason: 'missing_secret' };
  if (!signatureHeader) return { ok: false, reason: 'missing_signature_header' };

  const parts: Record<string, string> = {};
  for (const seg of signatureHeader.split(',')) {
    const eq = seg.indexOf('=');
    if (eq === -1) continue;
    const k = seg.slice(0, eq).trim();
    const v = seg.slice(eq + 1).trim();
    if (k && v) parts[k] = v;
  }

  const tsStr = parts.t;
  const v1 = parts.v1;
  if (!tsStr || !v1) return { ok: false, reason: 'malformed_signature_header' };

  const ts = Number(tsStr);
  if (!Number.isFinite(ts)) return { ok: false, reason: 'non_numeric_timestamp' };

  const replayWindow = opts.replayWindowSec ?? DEFAULT_REPLAY_WINDOW_SECONDS;
  const nowSec = opts.nowSec ?? Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > replayWindow) {
    return { ok: false, reason: 'replay_out_of_window' };
  }

  // v1 must be hex — Buffer.from(hex) silently drops non-hex chars, so
  // we guard up front.
  if (!/^[0-9a-fA-F]+$/.test(v1)) {
    return { ok: false, reason: 'signature_mismatch' };
  }

  const expected = crypto.createHmac('sha256', secret).update(`${ts}.${rawBody}`).digest('hex');

  const expectedBuf = Buffer.from(expected, 'hex');
  const receivedBuf = Buffer.from(v1, 'hex');

  if (expectedBuf.length !== receivedBuf.length) {
    return { ok: false, reason: 'signature_mismatch' };
  }
  if (!crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
    return { ok: false, reason: 'signature_mismatch' };
  }
  return { ok: true };
}

/**
 * Helper used by tests to produce a valid header for a known secret.
 * Exposed so emitter + receiver tests stay in sync without re-implementing
 * the format.
 */
export function signMadfamBody(
  rawBody: string,
  secret: string,
  ts: number = Math.floor(Date.now() / 1000)
): string {
  const hmac = crypto.createHmac('sha256', secret).update(`${ts}.${rawBody}`).digest('hex');
  return `t=${ts},v1=${hmac}`;
}
