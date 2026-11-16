import { expect, it } from 'vitest';
import { buildSitemapEntries } from './sitemap-entries';

it('lists only the home page as an absolute URL without dates', () => {
  expect(buildSitemapEntries(new URL('https://ada.example.com'))).toEqual([
    { url: 'https://ada.example.com/' },
  ]);
});
