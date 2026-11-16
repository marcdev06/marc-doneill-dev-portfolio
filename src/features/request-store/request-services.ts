import { readFile } from 'node:fs/promises';
import type { KeyValueStore } from '@/lib/request-store/key-value-store';
import { createMemoryKeyValueStore } from '@/lib/request-store/memory-key-value-store';
import { createStoreRateLimiter, type RateLimiter } from '@/lib/request-store/rate-limits';
import {
  readRequestStoreConfig,
  type EnvironmentVariables,
  type RequestStoreConfig,
} from '@/lib/request-store/request-store-config';
import { publishedResumeKey, type PublishedResume } from '@/lib/request-store/store-keys';
import {
  createResumeRequestRepository,
  type ResumeRequestRepository,
} from '@/lib/resume-request/resume-request-repository';
import { resumeRequestPendingWindowMs } from '@/lib/resume-request/resume-request-timing';

export interface RequestServices {
  store: KeyValueStore;
  repository: ResumeRequestRepository;
  rateLimiter: RateLimiter;
  pendingWindowMs: number;
}

export type RequestServicesResult =
  { isAvailable: true; services: RequestServices } | { isAvailable: false; problem: string };

type AvailableStoreConfig = Exclude<RequestStoreConfig, { mode: 'unconfigured' }>;

const servicesCacheKey = Symbol.for('marc-doneill-dev-portfolio.request-services');

interface GlobalServicesCache {
  [servicesCacheKey]?: Map<string, Promise<RequestServices>>;
}

// Actions and route handlers load separate bundles; globalThis is shared
function readServicesCache(): Map<string, Promise<RequestServices>> {
  const globalScope = globalThis as GlobalServicesCache;
  globalScope[servicesCacheKey] ??= new Map();
  return globalScope[servicesCacheKey];
}

async function seedFixtureResume(store: KeyValueStore, fixturePdfPath: string): Promise<void> {
  const pdfBytes = await readFile(fixturePdfPath);
  const publishedResume: PublishedResume = {
    pdfBase64: pdfBytes.toString('base64'),
    contentHash: 'test-fixture',
    generatedAt: new Date(0).toISOString(),
  };
  await store.writeJson(publishedResumeKey, publishedResume);
}

async function createServices(config: AvailableStoreConfig): Promise<RequestServices> {
  if (config.mode === 'redis') {
    // Lazy, so memory and unconfigured modes never load Upstash
    const [{ Redis }, { createRedisKeyValueStore }, { createUpstashRateLimiter }] =
      await Promise.all([
        import('@upstash/redis'),
        import('./redis-key-value-store'),
        import('./upstash-rate-limiter'),
      ]);
    const redis = new Redis({ url: config.url, token: config.token });
    const store = createRedisKeyValueStore(redis);
    return {
      store,
      repository: createResumeRequestRepository(store, config.environmentPrefix),
      rateLimiter: createUpstashRateLimiter(redis, config.environmentPrefix),
      pendingWindowMs: resumeRequestPendingWindowMs,
    };
  }

  const { pendingWindowMs, siteDailyLimit, fixturePdfPath } = config.testOverrides;
  const store = createMemoryKeyValueStore();
  if (fixturePdfPath) {
    await seedFixtureResume(store, fixturePdfPath);
  }
  return {
    store,
    repository: createResumeRequestRepository(store, config.environmentPrefix),
    rateLimiter: createStoreRateLimiter(
      store,
      config.environmentPrefix,
      siteDailyLimit === undefined ? {} : { resumeRequestSiteWide: siteDailyLimit },
    ),
    pendingWindowMs: pendingWindowMs ?? resumeRequestPendingWindowMs,
  };
}

export async function resolveRequestServices(
  environment: EnvironmentVariables = process.env,
): Promise<RequestServicesResult> {
  const config = readRequestStoreConfig(environment);
  if (config.mode === 'unconfigured') {
    return { isAvailable: false, problem: config.problem };
  }

  const servicesCache = readServicesCache();
  const cacheKey = JSON.stringify(config);
  let servicesPromise = servicesCache.get(cacheKey);
  if (!servicesPromise) {
    servicesPromise = createServices(config);
    servicesCache.set(cacheKey, servicesPromise);
    servicesPromise.catch(() => servicesCache.delete(cacheKey));
  }
  return { isAvailable: true, services: await servicesPromise };
}
