import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isBotSubmission } from './bot-verdict';

describe('isBotSubmission with the real BotID server package', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('answers human off Vercel, even in a production build, without a network call', async () => {
    vi.stubEnv('VERCEL', '');
    const consoleWarn = vi.spyOn(console, 'warn');

    await expect(isBotSubmission()).resolves.toBe(false);
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it('runs the real check on Vercel, which needs the OIDC token', async () => {
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('VERCEL_OIDC_TOKEN', '');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(isBotSubmission()).rejects.toThrow(/x-vercel-oidc-token/);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
