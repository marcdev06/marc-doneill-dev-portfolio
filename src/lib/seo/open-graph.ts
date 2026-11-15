import type { SiteContent } from '../content';

export interface OpenGraphPage {
  path: string;
  title: string;
  description: string;
}

export const openGraphImage = {
  path: '/opengraph-image',
  size: { width: 1200, height: 630 },
  contentType: 'image/png',
} as const;

// Pages that override openGraph drop the file-based image otherwise
export function buildOpenGraph(site: SiteContent, page: OpenGraphPage) {
  return {
    type: 'website' as const,
    siteName: site.name,
    locale: site.locale,
    url: page.path,
    title: page.title,
    description: page.description,
    images: [
      {
        url: openGraphImage.path,
        ...openGraphImage.size,
        type: openGraphImage.contentType,
        alt: site.openGraphImageAlt,
      },
    ],
  };
}
