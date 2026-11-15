// No imports: scripts/publish-resume-pdf.ts loads this file directly

export type EnvironmentVariables = Record<string, string | undefined>;

export type EnvironmentPrefix = 'production' | 'preview' | 'local';

export interface MemoryTestOverrides {
  pendingWindowMs?: number;
  siteDailyLimit?: number;
  fixturePdfPath?: string;
}

export type RequestStoreConfig =
  | { mode: 'redis'; url: string; token: string; environmentPrefix: EnvironmentPrefix }
  | { mode: 'memory'; environmentPrefix: 'local'; testOverrides: MemoryTestOverrides }
  | { mode: 'unconfigured'; problem: string };

function readSetting(environment: EnvironmentVariables, variableName: string) {
  const settingValue = environment[variableName]?.trim();
  return settingValue === '' ? undefined : settingValue;
}

function readPositiveInteger(environment: EnvironmentVariables, variableName: string) {
  const parsedValue = Number(readSetting(environment, variableName));
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
}

export function readEnvironmentPrefix(vercelEnvironment: string | undefined): EnvironmentPrefix {
  if (vercelEnvironment === 'production' || vercelEnvironment === 'preview') {
    return vercelEnvironment;
  }
  return 'local';
}

function readMemoryTestOverrides(environment: EnvironmentVariables): MemoryTestOverrides {
  const pendingWindowSeconds = readPositiveInteger(
    environment,
    'RESUME_REQUEST_PENDING_WINDOW_SECONDS',
  );
  return {
    pendingWindowMs: pendingWindowSeconds === undefined ? undefined : pendingWindowSeconds * 1000,
    siteDailyLimit: readPositiveInteger(environment, 'RESUME_REQUEST_SITE_DAILY_LIMIT'),
    fixturePdfPath: readSetting(environment, 'RESUME_REQUEST_FIXTURE_PDF'),
  };
}

export function readRedisCredentials(environment: EnvironmentVariables) {
  const url =
    readSetting(environment, 'UPSTASH_REDIS_REST_URL') ??
    readSetting(environment, 'KV_REST_API_URL');
  const token =
    readSetting(environment, 'UPSTASH_REDIS_REST_TOKEN') ??
    readSetting(environment, 'KV_REST_API_TOKEN');
  return url === undefined || token === undefined ? undefined : { url, token };
}

export function readRequestStoreConfig(environment: EnvironmentVariables): RequestStoreConfig {
  const storeMode = readSetting(environment, 'RESUME_REQUEST_STORE') ?? 'redis';
  if (storeMode === 'memory') {
    if (environment.VERCEL === '1') {
      return {
        mode: 'unconfigured',
        problem: 'RESUME_REQUEST_STORE=memory is for tests only and never runs on Vercel.',
      };
    }
    return {
      mode: 'memory',
      environmentPrefix: 'local',
      testOverrides: readMemoryTestOverrides(environment),
    };
  }
  if (storeMode !== 'redis') {
    return {
      mode: 'unconfigured',
      problem: `RESUME_REQUEST_STORE must be "redis" or "memory", not "${storeMode}".`,
    };
  }

  const credentials = readRedisCredentials(environment);
  if (!credentials) {
    return {
      mode: 'unconfigured',
      problem:
        'Set KV_REST_API_URL and KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN) to connect Redis.',
    };
  }
  return {
    mode: 'redis',
    ...credentials,
    environmentPrefix: readEnvironmentPrefix(environment.VERCEL_ENV),
  };
}
