import { resolveRequestServices } from '@/features/request-store/request-services';
import { readClientIp } from '@/lib/request-store/client-ip';
import {
  requesterTokenHeaderName,
  type ResumeRequestStatusResponse,
} from '@/lib/resume-request/resume-request-fields';
import { createPrivateJsonResponse } from './private-response';

export async function respondWithResumeRequestStatus(
  request: Request,
  requestId: string,
): Promise<Response> {
  try {
    const servicesResult = await resolveRequestServices();
    if (!servicesResult.isAvailable) {
      console.error(
        `[resume-request] The request store is not configured. ${servicesResult.problem}`,
      );
      return createPrivateJsonResponse({ error: 'unavailable' }, 503);
    }
    const { repository, rateLimiter } = servicesResult.services;
    if (!(await rateLimiter.isAllowed('resumeStatusPerIp', readClientIp(request.headers)))) {
      return createPrivateJsonResponse({ error: 'rate-limited' }, 429);
    }

    const view = await repository.findForRequester(
      requestId,
      request.headers.get(requesterTokenHeaderName) ?? undefined,
    );
    if (!view) {
      return createPrivateJsonResponse({ error: 'not-found' }, 404);
    }
    const statusResponse: ResumeRequestStatusResponse = { status: view.status };
    const grant = await repository.issueDownloadGrant(view);
    if (grant) {
      statusResponse.grant = grant;
    }
    return createPrivateJsonResponse(statusResponse);
  } catch (statusError) {
    console.error('[resume-request] Reading the request status failed:', statusError);
    return createPrivateJsonResponse({ error: 'unavailable' }, 503);
  }
}
