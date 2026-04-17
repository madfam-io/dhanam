/**
 * Tests for the MADFAM ecosystem signature verifier.
 *
 * This is security-critical — every edge case matters. If a signature
 * we SHOULD reject ever passes, we accept an attacker-crafted event as
 * real. If a signature we SHOULD accept ever fails, the revenue-loop
 * probe goes red and the flywheel looks broken when it isn't.
 */

import {
  DEFAULT_REPLAY_WINDOW_SECONDS,
  signMadfamBody,
  verifyMadfamSignature,
} from '../madfam-events.sig';

const SECRET = 's3cret-for-tests';
const BODY = JSON.stringify({ event_id: 'evt_1', amount_minor: 49900 });

// Fixed "now" so replay-window tests are deterministic.
const NOW = 1_800_000_000;

describe('verifyMadfamSignature', () => {
  it('accepts a valid current-timestamp signature', () => {
    const header = signMadfamBody(BODY, SECRET, NOW);
    const result = verifyMadfamSignature(BODY, header, SECRET, { nowSec: NOW });
    expect(result.ok).toBe(true);
  });

  it('rejects when secret is empty', () => {
    const header = signMadfamBody(BODY, SECRET, NOW);
    const result = verifyMadfamSignature(BODY, header, '', { nowSec: NOW });
    expect(result).toEqual({ ok: false, reason: 'missing_secret' });
  });

  it('rejects when header is missing', () => {
    expect(verifyMadfamSignature(BODY, undefined, SECRET, { nowSec: NOW })).toEqual({
      ok: false,
      reason: 'missing_signature_header',
    });
    expect(verifyMadfamSignature(BODY, null, SECRET, { nowSec: NOW })).toEqual({
      ok: false,
      reason: 'missing_signature_header',
    });
    expect(verifyMadfamSignature(BODY, '', SECRET, { nowSec: NOW })).toEqual({
      ok: false,
      reason: 'missing_signature_header',
    });
  });

  it('rejects malformed headers (missing t or v1)', () => {
    const onlyTs = `t=${NOW}`;
    const onlyV1 = `v1=abc`;
    const garbage = `foo=bar,baz=qux`;
    for (const bad of [onlyTs, onlyV1, garbage]) {
      expect(verifyMadfamSignature(BODY, bad, SECRET, { nowSec: NOW })).toEqual({
        ok: false,
        reason: 'malformed_signature_header',
      });
    }
  });

  it('rejects non-numeric timestamps', () => {
    const bad = `t=tuesday,v1=${signMadfamBody(BODY, SECRET, NOW).split(',')[1].slice(3)}`;
    expect(verifyMadfamSignature(BODY, bad, SECRET, { nowSec: NOW })).toEqual({
      ok: false,
      reason: 'non_numeric_timestamp',
    });
  });

  it('rejects timestamps outside the replay window (too old)', () => {
    const header = signMadfamBody(BODY, SECRET, NOW - DEFAULT_REPLAY_WINDOW_SECONDS - 1);
    expect(verifyMadfamSignature(BODY, header, SECRET, { nowSec: NOW })).toEqual({
      ok: false,
      reason: 'replay_out_of_window',
    });
  });

  it('rejects timestamps outside the replay window (too new)', () => {
    const header = signMadfamBody(BODY, SECRET, NOW + DEFAULT_REPLAY_WINDOW_SECONDS + 1);
    expect(verifyMadfamSignature(BODY, header, SECRET, { nowSec: NOW })).toEqual({
      ok: false,
      reason: 'replay_out_of_window',
    });
  });

  it('accepts timestamps exactly at the replay-window edge', () => {
    const header = signMadfamBody(BODY, SECRET, NOW - DEFAULT_REPLAY_WINDOW_SECONDS);
    expect(verifyMadfamSignature(BODY, header, SECRET, { nowSec: NOW })).toEqual({ ok: true });
  });

  it('rejects non-hex v1 values (prevents silent Buffer.from truncation)', () => {
    const bad = `t=${NOW},v1=not-hex-!!`;
    expect(verifyMadfamSignature(BODY, bad, SECRET, { nowSec: NOW })).toEqual({
      ok: false,
      reason: 'signature_mismatch',
    });
  });

  it('rejects when signed with a different secret', () => {
    const header = signMadfamBody(BODY, 'other-secret', NOW);
    expect(verifyMadfamSignature(BODY, header, SECRET, { nowSec: NOW })).toEqual({
      ok: false,
      reason: 'signature_mismatch',
    });
  });

  it('rejects when signed over a different body', () => {
    const header = signMadfamBody('different body', SECRET, NOW);
    expect(verifyMadfamSignature(BODY, header, SECRET, { nowSec: NOW })).toEqual({
      ok: false,
      reason: 'signature_mismatch',
    });
  });

  it('is length-mismatch safe (short v1 does not crash timingSafeEqual)', () => {
    const shortV1 = `t=${NOW},v1=abc123`;
    expect(verifyMadfamSignature(BODY, shortV1, SECRET, { nowSec: NOW })).toEqual({
      ok: false,
      reason: 'signature_mismatch',
    });
  });

  it('tolerates extra unknown fields in the header', () => {
    // Forward-compat: a future version might add `v2=...`. Extra fields
    // must not confuse the parser.
    const header = signMadfamBody(BODY, SECRET, NOW) + ',kid=2026-01';
    expect(verifyMadfamSignature(BODY, header, SECRET, { nowSec: NOW })).toEqual({ ok: true });
  });

  it('tolerates whitespace around the header segments', () => {
    const header = signMadfamBody(BODY, SECRET, NOW)
      .split(',')
      .map((s) => `  ${s}  `)
      .join(', ');
    expect(verifyMadfamSignature(BODY, header, SECRET, { nowSec: NOW })).toEqual({ ok: true });
  });

  it('honours a custom replay window', () => {
    const header = signMadfamBody(BODY, SECRET, NOW - 10);
    // 5-second window is tighter than the 10-second skew → reject.
    expect(
      verifyMadfamSignature(BODY, header, SECRET, {
        nowSec: NOW,
        replayWindowSec: 5,
      })
    ).toEqual({ ok: false, reason: 'replay_out_of_window' });
    // 60-second window is looser → accept.
    expect(
      verifyMadfamSignature(BODY, header, SECRET, {
        nowSec: NOW,
        replayWindowSec: 60,
      })
    ).toEqual({ ok: true });
  });
});

describe('signMadfamBody', () => {
  it('produces the t=<ts>,v1=<hex> shape', () => {
    const s = signMadfamBody(BODY, SECRET, NOW);
    expect(s).toMatch(new RegExp(`^t=${NOW},v1=[0-9a-f]{64}$`));
  });

  it('is deterministic for the same (body, secret, ts)', () => {
    expect(signMadfamBody(BODY, SECRET, NOW)).toBe(signMadfamBody(BODY, SECRET, NOW));
  });

  it('is self-verifying (round-trip test)', () => {
    const header = signMadfamBody(BODY, SECRET, NOW);
    expect(verifyMadfamSignature(BODY, header, SECRET, { nowSec: NOW })).toEqual({ ok: true });
  });
});
