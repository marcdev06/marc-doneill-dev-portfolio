import { createHash } from 'node:crypto';
import type { KeyValueStore } from './key-value-store';

const secondsPerHour = 60 * 60;
const secondsPerDay = 24 * secondsPerHour;

export interface RateLimitRule {
  limit: number;
  windowSeconds: number;
}

export const rateLimitRules = {
  resumeRequestPerIp: { limit: 3, windowSeconds: secondsPerDay },
  resumeRequestPerEmail: { limit: 2, windowSeconds: secondsPerDay },
  resumeRequestSiteWide: { limit: 20, windowSeconds: secondsPerDay },
  resumeStatusPerIp: { limit: 120, windowSeconds: 10 * 60 },
  contactMessagePerIp: { limit: 5, windowSeconds: secondsPerHour },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitRuleName = keyof typeof rateLimitRules;

export const siteWideIdentifier = 'site';

export interface RateLimiter {
  isAllowed(ruleName: RateLimitRuleName, identifier: string): Promise<boolean>;
}

// Raw IPs and emails never become Redis keys
export function hashIdentifier(identifier: string): string {
  return createHash('sha256').update(identifier.trim().toLowerCase()).digest('hex');
}

export function buildRateLimitKey(
  environmentPrefix: string,
  ruleName: RateLimitRuleName,
  identifier: string,
) {
  return {
    prefix: `${environmentPrefix}:rate-limit:${ruleName}`,
    hashedIdentifier: hashIdentifier(identifier),
  };
}

export function createStoreRateLimiter(
  store: KeyValueStore,
  environmentPrefix: string,
  ruleLimits: Partial<Record<RateLimitRuleName, number>> = {},
): RateLimiter {
  return {
    async isAllowed(ruleName, identifier) {
      const rule = rateLimitRules[ruleName];
      const { prefix, hashedIdentifier } = buildRateLimitKey(
        environmentPrefix,
        ruleName,
        identifier,
      );
      const hitCount = await store.increment(
        `${prefix}:${hashedIdentifier}`,
        rule.windowSeconds * 1000,
      );
      return hitCount <= (ruleLimits[ruleName] ?? rule.limit);
    },
  };
}

export async function isWithinResumeRequestLimits(
  rateLimiter: RateLimiter,
  clientIp: string,
  requesterEmail: string,
): Promise<boolean> {
  // One person's burst spends their own budget before the site's
  return (
    (await rateLimiter.isAllowed('resumeRequestPerIp', clientIp)) &&
    (await rateLimiter.isAllowed('resumeRequestPerEmail', requesterEmail)) &&
    (await rateLimiter.isAllowed('resumeRequestSiteWide', siteWideIdentifier))
  );
}
