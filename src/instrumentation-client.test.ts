import { expect, it, vi } from 'vitest';

const { startBotProtection } = vi.hoisted(() => ({ startBotProtection: vi.fn() }));

vi.mock('@/features/contact/bot-protection-client', () => ({ startBotProtection }));

it('starts bot protection before the app hydrates', async () => {
  await import('./instrumentation-client');

  expect(startBotProtection).toHaveBeenCalledTimes(1);
});
