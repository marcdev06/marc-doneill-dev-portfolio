import type { Redis } from '@upstash/redis';
import { beforeEach, expect, it, vi } from 'vitest';
import { hashIdentifier } from '@/lib/request-store/rate-limits';
import { createUpstashRateLimiter } from './upstash-rate-limiter';

const { constructRatelimit, limitRequest, slidingWindow } = vi.hoisted(() => ({
  constructRatelimit: vi.fn(),
  limitRequest: vi.fn(),
  slidingWindow: vi.fn((limit: number, window: string) => ({ limit, window })),
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    vi.fn(function FakeRatelimit(options: unknown) {
      constructRatelimit(options);
      return { limit: limitRequest };
    }),
    { slidingWindow },
  ),
}));

const fakeRedis = {} as Redis;

beforeEach(() => {
  constructRatelimit.mockReset();
  limitRequest.mockReset();
});

it('limits hashed identifiers with one sliding window per rule', async () => {
  limitRequest.mockResolvedValueOnce({ success: true }).mockResolvedValueOnce({ success: false });
  const rateLimiter = createUpstashRateLimiter(fakeRedis, 'production');

  expect(await rateLimiter.isAllowed('resumeRequestPerIp', '203.0.113.7')).toBe(true);
  expect(await rateLimiter.isAllowed('resumeRequestPerIp', '203.0.113.7')).toBe(false);

  expect(constructRatelimit).toHaveBeenCalledTimes(1);
  expect(constructRatelimit).toHaveBeenCalledWith({
    redis: fakeRedis,
    prefix: 'production:rate-limit:resumeRequestPerIp',
    limiter: { limit: 3, window: '86400 s' },
    analytics: false,
  });
  expect(limitRequest).toHaveBeenCalledWith(hashIdentifier('203.0.113.7'));
});

it('creates a separate limiter for each rule', async () => {
  limitRequest.mockResolvedValue({ success: true });
  const rateLimiter = createUpstashRateLimiter(fakeRedis, 'preview');

  await rateLimiter.isAllowed('contactMessagePerIp', '203.0.113.7');
  await rateLimiter.isAllowed('resumeStatusPerIp', '203.0.113.7');

  expect(slidingWindow).toHaveBeenCalledWith(5, '3600 s');
  expect(slidingWindow).toHaveBeenCalledWith(120, '600 s');
  expect(constructRatelimit).toHaveBeenCalledTimes(2);
});
