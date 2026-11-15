import { initBotId } from 'botid/client/core';

export const botProtectedRoutes = [{ path: '/', method: 'POST' }];

export function startBotProtection(): void {
  initBotId({ protect: botProtectedRoutes });
}
