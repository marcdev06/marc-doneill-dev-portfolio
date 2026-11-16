import { afterEach, describe, expect, it, vi } from 'vitest';
import { getConfiguredSiteUrl, getSiteUrl } from './site-url';

function stubSiteEnvironment(
  siteUrl: string | undefined,
  vercelProductionHost: string | undefined,
) {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', siteUrl);
  vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', vercelProductionHost);
}

describe('getSiteUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers NEXT_PUBLIC_SITE_URL over the Vercel host', () => {
    stubSiteEnvironment('https://portfolio.example.com', 'portfolio.vercel.app');

    expect(getSiteUrl().href).toBe('https://portfolio.example.com/');
  });

  it('falls back to the Vercel production host over https', () => {
    stubSiteEnvironment(undefined, 'portfolio.vercel.app');

    expect(getSiteUrl().href).toBe('https://portfolio.vercel.app/');
  });

  it('falls back to localhost when neither variable is defined', () => {
    stubSiteEnvironment(undefined, undefined);

    expect(getSiteUrl().href).toBe('http://localhost:3000/');
  });

  it('treats empty and whitespace-only values as unset', () => {
    stubSiteEnvironment('', '   ');

    expect(getSiteUrl().href).toBe('http://localhost:3000/');
  });

  it('gives the same URL with or without a trailing slash', () => {
    stubSiteEnvironment('https://portfolio.example.com/', undefined);
    const urlWithSlash = getSiteUrl();
    stubSiteEnvironment('https://portfolio.example.com', undefined);
    const urlWithoutSlash = getSiteUrl();

    expect(urlWithSlash.href).toBe('https://portfolio.example.com/');
    expect(urlWithSlash.href).toBe(urlWithoutSlash.href);
  });

  it('removes trailing slashes from a configured base path', () => {
    stubSiteEnvironment('https://example.com/portfolio//', undefined);

    expect(getSiteUrl().href).toBe('https://example.com/portfolio');
  });

  it('removes a trailing slash from the Vercel host', () => {
    stubSiteEnvironment(undefined, 'portfolio.vercel.app/');

    expect(getSiteUrl().href).toBe('https://portfolio.vercel.app/');
  });
});

describe('getConfiguredSiteUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns undefined when no public URL is configured', () => {
    stubSiteEnvironment(undefined, undefined);

    expect(getConfiguredSiteUrl()).toBeUndefined();
  });

  it('returns the configured URL when one is set', () => {
    stubSiteEnvironment(undefined, 'portfolio.vercel.app');

    expect(getConfiguredSiteUrl()?.href).toBe('https://portfolio.vercel.app/');
  });
});
