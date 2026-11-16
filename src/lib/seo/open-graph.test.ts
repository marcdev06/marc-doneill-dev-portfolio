import { expect, it } from 'vitest';
import { buildSiteInput } from '../../../test/content-fixtures';
import { siteSchema } from '../content';
import { buildOpenGraph } from './open-graph';

it('builds Open Graph fields for a page, with the shared site image', () => {
  const site = siteSchema.parse(buildSiteInput());

  expect(
    buildOpenGraph(site, { path: '/resume', title: 'CV · Ada', description: 'The CV of Ada.' }),
  ).toEqual({
    type: 'website',
    siteName: 'Ada Example',
    locale: 'en_GB',
    url: '/resume',
    title: 'CV · Ada',
    description: 'The CV of Ada.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'Ada Example, Engineer',
      },
    ],
  });
});
