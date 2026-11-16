import { describe, expect, it, vi } from 'vitest';
import { createMemoryKeyValueStore } from './memory-key-value-store';
import {
  buildRateLimitKey,
  createStoreRateLimiter,
  hashIdentifier,
  isWithinResumeRequestLimits,
  rateLimitRules,
  type RateLimiter,
} from './rate-limits';
import { readClientIp } from './client-ip';

describe('rateLimitRules', () => {
  it("matches Marc's limits", () => {
    expect(rateLimitRules).toEqual({
      resumeRequestPerIp: { limit: 3, windowSeconds: 86_400 },
      resumeRequestPerEmail: { limit: 2, windowSeconds: 86_400 },
      resumeRequestSiteWide: { limit: 20, windowSeconds: 86_400 },
      resumeStatusPerIp: { limit: 120, windowSeconds: 600 },
      contactMessagePerIp: { limit: 5, windowSeconds: 3_600 },
    });
  });
});

describe('buildRateLimitKey', () => {
  it('prefixes by environment and rule, and hashes the identifier', () => {
    const rateLimitKey = buildRateLimitKey('preview', 'resumeRequestPerIp', '203.0.113.7');

    expect(rateLimitKey).toEqual({
      prefix: 'preview:rate-limit:resumeRequestPerIp',
      hashedIdentifier: hashIdentifier('203.0.113.7'),
    });
    expect(rateLimitKey.hashedIdentifier).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(rateLimitKey)).not.toContain('203.0.113.7');
  });

  it('treats emails that differ only in case or spacing as one identifier', () => {
    expect(hashIdentifier(' Jane@Example.com ')).toBe(hashIdentifier('jane@example.com'));
  });
});

describe('createStoreRateLimiter', () => {
  it('allows each identifier up to the rule limit within its window', async () => {
    const rateLimiter = createStoreRateLimiter(createMemoryKeyValueStore(), 'local');

    const verdicts = [];
    for (let attempt = 0; attempt < 3; attempt += 1) {
      verdicts.push(await rateLimiter.isAllowed('resumeRequestPerEmail', 'jane@example.com'));
    }

    expect(verdicts).toEqual([true, true, false]);
    expect(await rateLimiter.isAllowed('resumeRequestPerEmail', 'john@example.com')).toBe(true);
  });

  it('honours a tighter or looser limit for one rule', async () => {
    const rateLimiter = createStoreRateLimiter(createMemoryKeyValueStore(), 'local', {
      resumeRequestSiteWide: 1,
    });

    expect(await rateLimiter.isAllowed('resumeRequestSiteWide', 'site')).toBe(true);
    expect(await rateLimiter.isAllowed('resumeRequestSiteWide', 'site')).toBe(false);
  });
});

describe('isWithinResumeRequestLimits', () => {
  function createRecordingLimiter(deniedRule?: string) {
    const checkedRules: string[] = [];
    const isAllowed = vi.fn<RateLimiter['isAllowed']>((ruleName) => {
      checkedRules.push(ruleName);
      return Promise.resolve(ruleName !== deniedRule);
    });
    const rateLimiter: RateLimiter = { isAllowed };
    return { rateLimiter, isAllowed, checkedRules };
  }

  it('checks the IP, then the email, then the site-wide budget', async () => {
    const { rateLimiter, isAllowed, checkedRules } = createRecordingLimiter();

    expect(await isWithinResumeRequestLimits(rateLimiter, '203.0.113.7', 'jane@example.com')).toBe(
      true,
    );
    expect(checkedRules).toEqual([
      'resumeRequestPerIp',
      'resumeRequestPerEmail',
      'resumeRequestSiteWide',
    ]);
    expect(isAllowed).toHaveBeenCalledWith('resumeRequestSiteWide', 'site');
  });

  it("stops at the first limit hit, so one person can't spend the site's budget", async () => {
    const { rateLimiter, checkedRules } = createRecordingLimiter('resumeRequestPerEmail');

    expect(await isWithinResumeRequestLimits(rateLimiter, '203.0.113.7', 'jane@example.com')).toBe(
      false,
    );
    expect(checkedRules).toEqual(['resumeRequestPerIp', 'resumeRequestPerEmail']);
  });
});

describe('readClientIp', () => {
  it('uses the first x-forwarded-for address', () => {
    expect(readClientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe(
      '203.0.113.7',
    );
  });

  it('falls back to x-real-ip, then to "unknown"', () => {
    expect(readClientIp(new Headers({ 'x-real-ip': ' 198.51.100.4 ' }))).toBe('198.51.100.4');
    expect(readClientIp(new Headers({ 'x-forwarded-for': ' ' }))).toBe('unknown');
  });
});
