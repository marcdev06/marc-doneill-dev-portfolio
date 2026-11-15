// Submits before BotID starts fail closed with a friendly message
export function loadBotProtection(): void {
  // Only Vercel serves BotID's challenge script
  if (!process.env.NEXT_PUBLIC_VERCEL_ENV) {
    return;
  }
  void import('./bot-protection-client').then(({ startBotProtection }) => {
    startBotProtection();
  });
}
