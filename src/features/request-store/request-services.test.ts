import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { publishedResumeKey } from '@/lib/request-store/store-keys';
import { resumeRequestPendingWindowMs } from '@/lib/resume-request/resume-request-timing';
import { forgetRequestServices } from '../../../test/request-services';
import { resolveRequestServices } from './request-services';

const { upstashRedisImports } = vi.hoisted(() => ({ upstashRedisImports: { count: 0 } }));

// Passes the real module through, counting when it loads
vi.mock('@upstash/redis', (importOriginal) => {
  upstashRedisImports.count += 1;
  return importOriginal();
});

async function requireServices(environment: Record<string, string>) {
  const servicesResult = await resolveRequestServices(environment);
  if (!servicesResult.isAvailable) {
    throw new Error(servicesResult.problem);
  }
  return servicesResult.services;
}

describe('resolveRequestServices', () => {
  afterEach(() => {
    forgetRequestServices();
    vi.unstubAllEnvs();
  });

  it('reports why the store is unavailable', async () => {
    expect(await resolveRequestServices({ RESUME_REQUEST_STORE: 'memory', VERCEL: '1' })).toEqual({
      isAvailable: false,
      problem: 'RESUME_REQUEST_STORE=memory is for tests only and never runs on Vercel.',
    });
  });

  it('shares one memory store per configuration across calls', async () => {
    const memoryEnvironment = { RESUME_REQUEST_STORE: 'memory' };

    const firstServices = await requireServices(memoryEnvironment);
    const secondServices = await requireServices(memoryEnvironment);

    expect(secondServices).toBe(firstServices);
    expect(firstServices.pendingWindowMs).toBe(resumeRequestPendingWindowMs);
  });

  it('applies the memory-only test overrides', async () => {
    const services = await requireServices({
      RESUME_REQUEST_STORE: 'memory',
      RESUME_REQUEST_PENDING_WINDOW_SECONDS: '3',
      RESUME_REQUEST_SITE_DAILY_LIMIT: '1',
    });

    expect(services.pendingWindowMs).toBe(3000);
    expect(await services.rateLimiter.isAllowed('resumeRequestSiteWide', 'site')).toBe(true);
    expect(await services.rateLimiter.isAllowed('resumeRequestSiteWide', 'site')).toBe(false);
  });

  it('seeds the memory store with a fixture PDF', async () => {
    const fixtureDirectory = await mkdtemp(path.join(tmpdir(), 'resume-fixture-'));
    const fixturePdfPath = path.join(fixtureDirectory, 'fixture.pdf');
    await writeFile(fixturePdfPath, '%PDF-1.4 fixture');
    try {
      const services = await requireServices({
        RESUME_REQUEST_STORE: 'memory',
        RESUME_REQUEST_FIXTURE_PDF: fixturePdfPath,
      });

      expect(await services.store.readJson(publishedResumeKey)).toEqual({
        pdfBase64: Buffer.from('%PDF-1.4 fixture').toString('base64'),
        contentHash: 'test-fixture',
        generatedAt: '1970-01-01T00:00:00.000Z',
      });
    } finally {
      await rm(fixtureDirectory, { recursive: true, force: true });
    }
  });

  it('retries after a failed setup instead of caching the failure', async () => {
    const brokenEnvironment = {
      RESUME_REQUEST_STORE: 'memory',
      RESUME_REQUEST_FIXTURE_PDF: 'does-not-exist.pdf',
    };

    await expect(resolveRequestServices(brokenEnvironment)).rejects.toThrow(/ENOENT/);
    await expect(resolveRequestServices(brokenEnvironment)).rejects.toThrow(/ENOENT/);
  });

  it('loads Upstash only for Redis, without a network call', async () => {
    await requireServices({ RESUME_REQUEST_STORE: 'memory' });
    expect(upstashRedisImports.count).toBe(0);

    const services = await requireServices({
      KV_REST_API_URL: 'https://example.upstash.io',
      KV_REST_API_TOKEN: 'placeholder-token',
      VERCEL_ENV: 'preview',
    });

    expect(upstashRedisImports.count).toBe(1);
    expect(services.pendingWindowMs).toBe(resumeRequestPendingWindowMs);
    expect(typeof services.rateLimiter.isAllowed).toBe('function');
  });

  it('reads process.env by default', async () => {
    vi.stubEnv('RESUME_REQUEST_STORE', 'memory');
    vi.stubEnv('VERCEL', '');

    expect((await resolveRequestServices()).isAvailable).toBe(true);
  });
});
