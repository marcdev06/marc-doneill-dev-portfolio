import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { botProtectedRoutes, startBotProtection } from './bot-protection-client';

const { initBotId } = vi.hoisted(() => ({ initBotId: vi.fn() }));

vi.mock('botid/client/core', () => ({ initBotId }));

describe('startBotProtection', () => {
  beforeEach(() => {
    initBotId.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('protects POSTs to the home page, where the Server Action runs', () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');

    startBotProtection();

    expect(initBotId).toHaveBeenCalledWith({ protect: [{ path: '/', method: 'POST' }] });
    expect(botProtectedRoutes).toEqual([{ path: '/', method: 'POST' }]);
  });

  it('stays off outside Vercel, where no challenge script is served', () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', '');

    startBotProtection();

    expect(initBotId).not.toHaveBeenCalled();
  });
});
