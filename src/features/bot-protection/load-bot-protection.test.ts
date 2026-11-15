import { afterEach, expect, it, vi } from 'vitest';
import { loadBotProtection } from './load-bot-protection';

const { startBotProtection } = vi.hoisted(() => ({ startBotProtection: vi.fn() }));

vi.mock('./bot-protection-client', () => ({ startBotProtection }));

afterEach(() => {
  vi.unstubAllEnvs();
  startBotProtection.mockReset();
});

it('starts BotID on Vercel', async () => {
  vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');

  loadBotProtection();

  await vi.waitFor(() => {
    expect(startBotProtection).toHaveBeenCalledTimes(1);
  });
});

it('never loads BotID off Vercel, where its challenge script would 404', async () => {
  vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', '');

  loadBotProtection();
  await Promise.resolve();

  expect(startBotProtection).not.toHaveBeenCalled();
});
