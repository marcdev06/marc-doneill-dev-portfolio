import { vi } from 'vitest';

const servicesCacheKey = Symbol.for('marc-doneill-dev-portfolio.request-services');

// Each test starts with an empty memory store
export function forgetRequestServices() {
  Reflect.deleteProperty(globalThis, servicesCacheKey);
}

export function useMemoryRequestStore(overrides: Record<string, string> = {}) {
  forgetRequestServices();
  vi.stubEnv('RESUME_REQUEST_STORE', 'memory');
  vi.stubEnv('VERCEL', '');
  for (const [variableName, value] of Object.entries(overrides)) {
    vi.stubEnv(variableName, value);
  }
}

export function useUnconfiguredRequestStore() {
  forgetRequestServices();
  vi.stubEnv('RESUME_REQUEST_STORE', '');
  vi.stubEnv('KV_REST_API_URL', '');
  vi.stubEnv('KV_REST_API_TOKEN', '');
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
}
