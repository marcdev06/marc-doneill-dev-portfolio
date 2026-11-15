import { initBotId } from 'botid/client/core';

export const botProtectedRoutes = [{ path: '/', method: 'POST' }];

export function startBotProtection(): void {
  // Vercel serves the challenge script; other hosts would 404
  if (!process.env.NEXT_PUBLIC_VERCEL_ENV) {
    return;
  }
  initBotId({ protect: botProtectedRoutes });
}
