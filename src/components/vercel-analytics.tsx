import { Analytics } from '@vercel/analytics/next';

export function VercelAnalytics() {
  // Only Vercel serves /_vercel/insights; elsewhere it would 404
  if (!process.env.NEXT_PUBLIC_VERCEL_ENV) {
    return null;
  }
  return <Analytics />;
}
