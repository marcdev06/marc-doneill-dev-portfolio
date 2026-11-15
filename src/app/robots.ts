import type { MetadataRoute } from 'next';
import { buildRobotsRules } from '@/lib/seo';
import { getSiteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return buildRobotsRules(getSiteUrl(), process.env.VERCEL_ENV);
}
