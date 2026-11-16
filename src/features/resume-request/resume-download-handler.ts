import { resolveRequestServices } from '@/features/request-store/request-services';
import { publishedResumeKey, type PublishedResume } from '@/lib/request-store/store-keys';
import { privateResponseHeaders } from './private-response';

export interface ResumeDownloadOptions {
  fileName: string;
  currentContentHash: string;
}

function createPrivateTextResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { ...privateResponseHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export async function respondWithResumeDownload(
  request: Request,
  { fileName, currentContentHash }: ResumeDownloadOptions,
): Promise<Response> {
  try {
    const servicesResult = await resolveRequestServices();
    if (!servicesResult.isAvailable) {
      console.error(
        `[resume-request] The request store is not configured. ${servicesResult.problem}`,
      );
      return createPrivateTextResponse('The resume is not available right now.', 503);
    }
    const { repository, store } = servicesResult.services;
    const grant = new URL(request.url).searchParams.get('grant');
    const requestId = await repository.findGrantedRequestId(grant);
    if (!requestId) {
      return createPrivateTextResponse('This download link has expired.', 404);
    }

    const publishedResume = await store.readJson<PublishedResume>(publishedResumeKey);
    if (!publishedResume) {
      console.error('[resume-request] No resume PDF is published. Run `npm run resume:publish`.');
      return createPrivateTextResponse('The resume is not available right now.', 503);
    }
    if (!(await repository.consumeDownload(requestId))) {
      return createPrivateTextResponse('This download link has been used up.', 404);
    }
    if (publishedResume.contentHash !== currentContentHash) {
      console.warn('[resume-request] The published PDF is older than the content; republish it.');
    }

    return new Response(Buffer.from(publishedResume.pdfBase64, 'base64'), {
      headers: {
        ...privateResponseHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (downloadError) {
    console.error('[resume-request] Serving the resume failed:', downloadError);
    return createPrivateTextResponse('The resume is not available right now.', 503);
  }
}
