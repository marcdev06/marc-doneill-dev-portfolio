import { resolveRequestServices } from '@/features/request-store/request-services';
import type { ResumeRequestView } from '@/lib/resume-request/resume-request-repository';

export async function loadResumeRequestReview(
  requestId: string,
  approvalToken: string | undefined,
): Promise<ResumeRequestView | undefined> {
  const servicesResult = await resolveRequestServices();
  if (!servicesResult.isAvailable) {
    console.error(
      `[resume-request] The request store is not configured. ${servicesResult.problem}`,
    );
    return undefined;
  }
  return servicesResult.services.repository.findForReviewer(requestId, approvalToken);
}
