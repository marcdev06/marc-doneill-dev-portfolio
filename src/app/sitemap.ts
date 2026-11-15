import type { MetadataRoute } from 'next';
import { buildSitemapEntries } from '@/lib/seo';
import { getSiteUrl } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries(getSiteUrl());
}
