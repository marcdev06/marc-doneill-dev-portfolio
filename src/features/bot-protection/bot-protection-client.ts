import { initBotId } from 'botid/client/core';

export const botProtectedRoutes = [{ path: '/', method: 'POST' }];

let hasStarted = false;

export function startBotProtection(): void {
  if (hasStarted) {
    return;
  }
  hasStarted = true;
  initBotId({ protect: botProtectedRoutes });
}
