import { describe, expect, it } from 'vitest';
import { buildReviewLink, buildReviewPath, resolveReviewBaseUrl } from './review-link';

const productionUrl = new URL('https://marc-doneill-dev-portfolio.vercel.app');

describe('resolveReviewBaseUrl', () => {
  it('uses the production URL in production', () => {
    expect(
      resolveReviewBaseUrl({
        siteUrl: productionUrl,
        vercelEnvironment: 'production',
        vercelBranchUrl: 'portfolio-git-main-marcdev06.vercel.app',
      }).href,
    ).toBe('https://marc-doneill-dev-portfolio.vercel.app/');
  });

  it("uses the preview's own branch URL on previews", () => {
    expect(
      resolveReviewBaseUrl({
        siteUrl: productionUrl,
        vercelEnvironment: 'preview',
        vercelBranchUrl: 'portfolio-git-staging-marcdev06.vercel.app/',
      }).href,
    ).toBe('https://portfolio-git-staging-marcdev06.vercel.app/');
  });

  it('uses the site URL locally and on previews without a branch URL', () => {
    const localUrl = new URL('http://localhost:3000');

    expect(
      resolveReviewBaseUrl({
        siteUrl: localUrl,
        vercelEnvironment: undefined,
        vercelBranchUrl: undefined,
      }),
    ).toBe(localUrl);
    expect(
      resolveReviewBaseUrl({
        siteUrl: localUrl,
        vercelEnvironment: 'preview',
        vercelBranchUrl: ' ',
      }),
    ).toBe(localUrl);
  });
});

describe('buildReviewLink', () => {
  it('points at the review page with the approval token', () => {
    expect(
      buildReviewLink(
        { siteUrl: productionUrl, vercelEnvironment: 'production', vercelBranchUrl: undefined },
        'abc_123-xyz',
        'token+/=',
      ),
    ).toBe(
      'https://marc-doneill-dev-portfolio.vercel.app/resume-requests/abc_123-xyz?token=token%2B%2F%3D',
    );
    expect(buildReviewPath('abc', 'token')).toBe('/resume-requests/abc?token=token');
  });
});
