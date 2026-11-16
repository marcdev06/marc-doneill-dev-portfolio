// No imports: scripts/publish-resume-pdf.ts loads this file directly

export const publishedResumeKey = 'resume:published-pdf';

export interface PublishedResume {
  pdfBase64: string;
  contentHash: string;
  generatedAt: string;
}

export function buildResumeRequestKeys(environmentPrefix: string) {
  const requestKey = (requestId: string) => `${environmentPrefix}:resume-request:${requestId}`;
  return {
    request: requestKey,
    decision: (requestId: string) => `${requestKey(requestId)}:decision`,
    grantWindow: (requestId: string) => `${requestKey(requestId)}:grant-window`,
    downloads: (requestId: string) => `${requestKey(requestId)}:downloads`,
    grant: (grantHash: string) => `${environmentPrefix}:resume-grant:${grantHash}`,
  };
}

export type ResumeRequestKeys = ReturnType<typeof buildResumeRequestKeys>;
