import { describe, expect, it } from 'vitest';
import { buildRobotsRules, isVercelNonProductionDeployment } from './robots-rules';

const siteUrl = new URL('https://ada.example.com');

describe('buildRobotsRules', () => {
  it.each([
    ['local, CI and Lighthouse runs', undefined],
    ['an empty VERCEL_ENV', ''],
    ['Vercel production', 'production'],
  ])('allows crawling and lists the absolute sitemap for %s', (_, vercelEnvironment) => {
    expect(buildRobotsRules(siteUrl, vercelEnvironment)).toEqual({
      rules: { userAgent: '*', allow: '/' },
      sitemap: 'https://ada.example.com/sitemap.xml',
    });
  });

  it.each(['preview', 'development'])(
    'disallows everything on a Vercel %s deploy',
    (vercelEnvironment) => {
      expect(buildRobotsRules(siteUrl, vercelEnvironment)).toEqual({
        rules: { userAgent: '*', disallow: '/' },
      });
    },
  );
});

describe('isVercelNonProductionDeployment', () => {
  it('is true only when VERCEL_ENV names a non-production environment', () => {
    expect(isVercelNonProductionDeployment('preview')).toBe(true);
    expect(isVercelNonProductionDeployment('production')).toBe(false);
    expect(isVercelNonProductionDeployment(undefined)).toBe(false);
  });
});
