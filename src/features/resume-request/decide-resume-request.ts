'use server';

import { notFound, redirect } from 'next/navigation';
import { resolveRequestServices } from '@/features/request-store/request-services';
import type { ResumeRequestDecision } from '@/lib/resume-request/resume-request-repository';
import { buildReviewPath } from '@/lib/resume-request/review-link';

function readTextField(formData: FormData, fieldName: string): string {
  const fieldValue = formData.get(fieldName);
  return typeof fieldValue === 'string' ? fieldValue : '';
}

function readDecision(formData: FormData): ResumeRequestDecision | undefined {
  const decision = readTextField(formData, 'decision');
  return decision === 'approved' || decision === 'denied' ? decision : undefined;
}

// GET only displays; mail scanners prefetch links
export async function decideResumeRequest(formData: FormData): Promise<void> {
  const requestId = readTextField(formData, 'requestId');
  const approvalToken = readTextField(formData, 'token');
  const decision = readDecision(formData);
  const servicesResult = await resolveRequestServices();
  if (!servicesResult.isAvailable) {
    console.error(
      `[resume-request] The request store is not configured. ${servicesResult.problem}`,
    );
    notFound();
  }
  if (!decision) {
    notFound();
  }

  const outcome = await servicesResult.services.repository.decide(
    requestId,
    approvalToken,
    decision,
  );
  if (outcome === 'not-found') {
    notFound();
  }
  redirect(buildReviewPath(requestId, approvalToken));
}
