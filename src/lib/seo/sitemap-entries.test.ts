import { expect, it } from 'vitest';
import { buildSitemapEntries } from './sitemap-entries';

it('lists the home and resume pages as absolute URLs without dates', () => {
  expect(buildSitemapEntries(new URL('https://ada.example.com'))).toEqual([
    { url: 'https://ada.example.com/' },
    { url: 'https://ada.example.com/resume' },
  ]);
});
