import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  doesTokenMatchHash,
  generateRequestId,
  generateSecretToken,
  hashSecretToken,
  isWellFormedRequestId,
  isWellFormedSecretToken,
} from './resume-request-tokens';

describe('generateRequestId', () => {
  it('makes 128-bit base64url ids that differ every time', () => {
    const requestIds = new Set(Array.from({ length: 50 }, () => generateRequestId()));

    expect(requestIds.size).toBe(50);
    for (const requestId of requestIds) {
      expect(Buffer.from(requestId, 'base64url')).toHaveLength(16);
      expect(isWellFormedRequestId(requestId)).toBe(true);
    }
  });
});

describe('generateSecretToken', () => {
  it('makes 32-byte base64url tokens', () => {
    const secretToken = generateSecretToken();

    expect(Buffer.from(secretToken, 'base64url')).toHaveLength(32);
    expect(isWellFormedSecretToken(secretToken)).toBe(true);
    expect(generateSecretToken()).not.toBe(secretToken);
  });
});

describe('hashSecretToken', () => {
  it('stores the SHA-256 digest, never the token', () => {
    const secretToken = generateSecretToken();

    expect(hashSecretToken(secretToken)).toBe(
      createHash('sha256').update(secretToken).digest('base64url'),
    );
    expect(hashSecretToken(secretToken)).not.toContain(secretToken);
  });
});

describe('doesTokenMatchHash', () => {
  it('accepts only the token behind the stored hash', () => {
    const secretToken = generateSecretToken();
    const storedHash = hashSecretToken(secretToken);

    expect(doesTokenMatchHash(secretToken, storedHash)).toBe(true);
    expect(doesTokenMatchHash(generateSecretToken(), storedHash)).toBe(false);
    expect(doesTokenMatchHash(secretToken, 'too-short')).toBe(false);
  });
});

describe('well-formed checks', () => {
  it.each(['', 'short', 'x'.repeat(22) + '!', 'a b'])('rejects the request id %j', (requestId) => {
    expect(isWellFormedRequestId(requestId)).toBe(false);
  });

  it.each(['', 'x'.repeat(42), 'x'.repeat(44), `${'x'.repeat(42)}=`])(
    'rejects the token %j',
    (secretToken) => {
      expect(isWellFormedSecretToken(secretToken)).toBe(false);
    },
  );
});
