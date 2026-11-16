import { expect, it, vi } from 'vitest';
import { botProtectedRoutes, startBotProtection } from './bot-protection-client';

const { initBotId } = vi.hoisted(() => ({ initBotId: vi.fn() }));

vi.mock('botid/client/core', () => ({ initBotId }));

it('protects POSTs to the home page once, however often it starts', () => {
  startBotProtection();
  startBotProtection();

  expect(initBotId).toHaveBeenCalledTimes(1);
  expect(initBotId).toHaveBeenCalledWith({ protect: [{ path: '/', method: 'POST' }] });
  expect(botProtectedRoutes).toEqual([{ path: '/', method: 'POST' }]);
});
