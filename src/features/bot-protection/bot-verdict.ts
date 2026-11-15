import { checkBotId } from 'botid/server';

export async function isBotSubmission(): Promise<boolean> {
  // BotID verifies only on Vercel; elsewhere it answers human
  const isOffVercel = process.env.VERCEL !== '1';
  const verification = await checkBotId({
    developmentOptions: { isDevelopment: isOffVercel, bypass: 'HUMAN' },
  });
  return verification.isBot;
}
