import { Ratelimit, type Duration } from '@upstash/ratelimit';
import type { Redis } from '@upstash/redis';
import {
  buildRateLimitKey,
  rateLimitRules,
  type RateLimiter,
  type RateLimitRuleName,
} from '@/lib/request-store/rate-limits';

export function createUpstashRateLimiter(redis: Redis, environmentPrefix: string): RateLimiter {
  const limitersByRule = new Map<RateLimitRuleName, Ratelimit>();

  function findLimiter(ruleName: RateLimitRuleName, prefix: string): Ratelimit {
    const existingLimiter = limitersByRule.get(ruleName);
    if (existingLimiter) {
      return existingLimiter;
    }
    const rule = rateLimitRules[ruleName];
    const limiter = new Ratelimit({
      redis,
      prefix,
      limiter: Ratelimit.slidingWindow(rule.limit, `${String(rule.windowSeconds)} s` as Duration),
      analytics: false,
    });
    limitersByRule.set(ruleName, limiter);
    return limiter;
  }

  return {
    async isAllowed(ruleName, identifier) {
      const { prefix, hashedIdentifier } = buildRateLimitKey(
        environmentPrefix,
        ruleName,
        identifier,
      );
      const { success } = await findLimiter(ruleName, prefix).limit(hashedIdentifier);
      return success;
    },
  };
}
