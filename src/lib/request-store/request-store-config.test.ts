import { describe, expect, it } from 'vitest';
import {
  readEnvironmentPrefix,
  readRedisCredentials,
  readRequestStoreConfig,
} from './request-store-config';

const marketplaceVariables = {
  KV_REST_API_URL: 'https://example.upstash.io',
  KV_REST_API_TOKEN: 'marketplace-token',
};

describe('readRequestStoreConfig', () => {
  it('connects Redis with the Vercel Marketplace variables, keyed by environment', () => {
    expect(readRequestStoreConfig({ ...marketplaceVariables, VERCEL_ENV: 'production' })).toEqual({
      mode: 'redis',
      url: 'https://example.upstash.io',
      token: 'marketplace-token',
      environmentPrefix: 'production',
    });
    expect(
      readRequestStoreConfig({ ...marketplaceVariables, RESUME_REQUEST_STORE: 'redis' }),
    ).toMatchObject({ mode: 'redis', environmentPrefix: 'local' });
  });

  it('prefers the Upstash dashboard variables, like the SDK does', () => {
    expect(
      readRedisCredentials({
        ...marketplaceVariables,
        UPSTASH_REDIS_REST_URL: 'https://dashboard.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'dashboard-token',
      }),
    ).toEqual({ url: 'https://dashboard.upstash.io', token: 'dashboard-token' });
  });

  it('is unconfigured, saying what to set, without both Redis variables', () => {
    const expectedProblem =
      'Set KV_REST_API_URL and KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN) to connect Redis.';

    expect(readRequestStoreConfig({})).toEqual({ mode: 'unconfigured', problem: expectedProblem });
    expect(readRequestStoreConfig({ KV_REST_API_URL: 'https://example.upstash.io' })).toEqual({
      mode: 'unconfigured',
      problem: expectedProblem,
    });
    expect(readRequestStoreConfig({ ...marketplaceVariables, KV_REST_API_TOKEN: ' ' })).toEqual({
      mode: 'unconfigured',
      problem: expectedProblem,
    });
  });

  it('uses the memory store only when asked, with its test-only overrides', () => {
    expect(
      readRequestStoreConfig({
        RESUME_REQUEST_STORE: ' memory ',
        RESUME_REQUEST_PENDING_WINDOW_SECONDS: '3',
        RESUME_REQUEST_SITE_DAILY_LIMIT: '1000',
        RESUME_REQUEST_FIXTURE_PDF: 'e2e/fixtures/resume-fixture.pdf',
      }),
    ).toEqual({
      mode: 'memory',
      environmentPrefix: 'local',
      testOverrides: {
        pendingWindowMs: 3000,
        siteDailyLimit: 1000,
        fixturePdfPath: 'e2e/fixtures/resume-fixture.pdf',
      },
    });
  });

  it('ignores overrides that are not positive whole numbers', () => {
    expect(
      readRequestStoreConfig({
        RESUME_REQUEST_STORE: 'memory',
        RESUME_REQUEST_PENDING_WINDOW_SECONDS: '-5',
        RESUME_REQUEST_SITE_DAILY_LIMIT: 'lots',
      }),
    ).toEqual({
      mode: 'memory',
      environmentPrefix: 'local',
      testOverrides: {
        pendingWindowMs: undefined,
        siteDailyLimit: undefined,
        fixturePdfPath: undefined,
      },
    });
  });

  it('fails closed when the memory store is asked for on Vercel', () => {
    expect(
      readRequestStoreConfig({
        ...marketplaceVariables,
        RESUME_REQUEST_STORE: 'memory',
        VERCEL: '1',
      }),
    ).toEqual({
      mode: 'unconfigured',
      problem: 'RESUME_REQUEST_STORE=memory is for tests only and never runs on Vercel.',
    });
  });

  it('rejects an unknown store', () => {
    expect(readRequestStoreConfig({ RESUME_REQUEST_STORE: 'postgres' })).toEqual({
      mode: 'unconfigured',
      problem: 'RESUME_REQUEST_STORE must be "redis" or "memory", not "postgres".',
    });
  });
});

describe('readEnvironmentPrefix', () => {
  it.each([
    ['production', 'production'],
    ['preview', 'preview'],
    ['development', 'local'],
    [undefined, 'local'],
  ])('maps VERCEL_ENV %s to %s', (vercelEnvironment, expectedPrefix) => {
    expect(readEnvironmentPrefix(vercelEnvironment)).toBe(expectedPrefix);
  });
});
