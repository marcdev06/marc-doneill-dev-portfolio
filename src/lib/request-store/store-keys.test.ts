import { expect, it } from 'vitest';
import { buildResumeRequestKeys, publishedResumeKey } from './store-keys';

it('prefixes request keys by environment and shares one published PDF key', () => {
  const keys = buildResumeRequestKeys('production');

  expect([
    keys.request('abc'),
    keys.decision('abc'),
    keys.grantWindow('abc'),
    keys.downloads('abc'),
    keys.grant('hash'),
  ]).toEqual([
    'production:resume-request:abc',
    'production:resume-request:abc:decision',
    'production:resume-request:abc:grant-window',
    'production:resume-request:abc:downloads',
    'production:resume-grant:hash',
  ]);
  expect(publishedResumeKey).toBe('resume:published-pdf');
});
