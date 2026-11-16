export interface ReviewLinkSources {
  siteUrl: URL;
  vercelEnvironment: string | undefined;
  vercelBranchUrl: string | undefined;
}

// Previews have their own host; production and local use the site URL
export function resolveReviewBaseUrl({
  siteUrl,
  vercelEnvironment,
  vercelBranchUrl,
}: ReviewLinkSources): URL {
  const branchHost = vercelBranchUrl?.trim().replace(/\/+$/, '');
  if (vercelEnvironment === 'preview' && branchHost) {
    return new URL(`https://${branchHost}`);
  }
  return siteUrl;
}

export function buildReviewPath(requestId: string, approvalToken: string): string {
  const searchParams = new URLSearchParams({ token: approvalToken });
  return `/resume-requests/${encodeURIComponent(requestId)}?${searchParams.toString()}`;
}

export function buildReviewLink(
  sources: ReviewLinkSources,
  requestId: string,
  approvalToken: string,
): string {
  return new URL(buildReviewPath(requestId, approvalToken), resolveReviewBaseUrl(sources)).href;
}
