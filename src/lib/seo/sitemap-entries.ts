export const indexedPagePaths = ['/'] as const;

export function buildSitemapEntries(siteUrl: URL): { url: string }[] {
  return indexedPagePaths.map((pagePath) => ({ url: new URL(pagePath, siteUrl).href }));
}
