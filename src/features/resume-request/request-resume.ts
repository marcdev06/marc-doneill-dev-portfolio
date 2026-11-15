'use server';

import { headers } from 'next/headers';
import { isBotSubmission } from '@/features/bot-protection/bot-verdict';
import { createEmailSender } from '@/features/email/email-sender';
import { resolveRequestServices } from '@/features/request-store/request-services';
import { readContactDeliveryConfig } from '@/lib/contact/contact-delivery-config';
import { readClientIp } from '@/lib/request-store/client-ip';
import { isWithinResumeRequestLimits } from '@/lib/request-store/rate-limits';
import { composeResumeRequestEmail } from '@/lib/resume-request/resume-request-email';
import {
  emptyResumeRequestFieldValues,
  resumeRequestFieldLimits,
  resumeRequestHoneypotFieldName,
  type ResumeRequestFieldValues,
} from '@/lib/resume-request/resume-request-fields';
import { parseResumeRequest, readCountryCode } from '@/lib/resume-request/resume-request-schema';
import { generateRequestId, generateSecretToken } from '@/lib/resume-request/resume-request-tokens';
import { buildReviewLink } from '@/lib/resume-request/review-link';
import { getSiteUrl } from '@/lib/site-url';
import type { ResumeRequestFormState } from './resume-request-form-state';

type RequestOutcome = Pick<ResumeRequestFormState, 'status' | 'invalidFields' | 'pendingRequest'>;

const failedOutcome: RequestOutcome = { status: 'failed', invalidFields: [] };

function readTextField(formData: FormData, fieldName: string): string {
  const fieldValue = formData.get(fieldName);
  return typeof fieldValue === 'string' ? fieldValue : '';
}

function readSubmittedValues(formData: FormData): ResumeRequestFieldValues {
  return {
    name: readTextField(formData, 'name').slice(0, resumeRequestFieldLimits.name.maxLength + 1),
    email: readTextField(formData, 'email').slice(0, resumeRequestFieldLimits.email.maxLength + 1),
    note: readTextField(formData, 'note').slice(0, resumeRequestFieldLimits.note.maxLength + 1),
  };
}

// Echo at most each field's limit back to the browser
function capEchoedValues(submittedValues: ResumeRequestFieldValues): ResumeRequestFieldValues {
  return {
    name: submittedValues.name.slice(0, resumeRequestFieldLimits.name.maxLength),
    email: submittedValues.email.slice(0, resumeRequestFieldLimits.email.maxLength),
    note: submittedValues.note.slice(0, resumeRequestFieldLimits.note.maxLength),
  };
}

async function createRequest(
  formData: FormData,
  submittedValues: ResumeRequestFieldValues,
): Promise<RequestOutcome> {
  if (await isBotSubmission()) {
    console.warn('[resume-request] BotID classified the request as a bot; nothing was stored.');
    return failedOutcome;
  }
  if (readTextField(formData, resumeRequestHoneypotFieldName) !== '') {
    const fakeRequest = { requestId: generateRequestId(), requesterToken: generateSecretToken() };
    return { status: 'waiting', invalidFields: [], pendingRequest: fakeRequest };
  }

  const parseResult = parseResumeRequest(submittedValues);
  if (!parseResult.isValid) {
    return { status: 'invalid', invalidFields: parseResult.invalidFields };
  }

  const servicesResult = await resolveRequestServices();
  if (!servicesResult.isAvailable) {
    console.error(
      `[resume-request] The request store is not configured. ${servicesResult.problem}`,
    );
    return failedOutcome;
  }
  const deliveryConfig = readContactDeliveryConfig(process.env);
  if (deliveryConfig.mode === 'unconfigured') {
    console.error(`[resume-request] Email delivery is not configured. ${deliveryConfig.problem}`);
    return failedOutcome;
  }

  const { submission } = parseResult;
  const { repository, rateLimiter, pendingWindowMs } = servicesResult.services;
  const requestHeaders = await headers();
  const clientIp = readClientIp(requestHeaders);
  if (!(await isWithinResumeRequestLimits(rateLimiter, clientIp, submission.email))) {
    console.warn('[resume-request] A rate limit was reached; nothing was stored.');
    return { status: 'rate-limited', invalidFields: [] };
  }

  const { record, requesterToken, approvalToken } = await repository.create(
    { ...submission, country: readCountryCode(requestHeaders.get('x-vercel-ip-country')) },
    pendingWindowMs,
  );
  const reviewLink = buildReviewLink(
    {
      siteUrl: getSiteUrl(),
      vercelEnvironment: process.env.VERCEL_ENV,
      vercelBranchUrl: process.env.VERCEL_BRANCH_URL,
    },
    record.id,
    approvalToken,
  );
  await createEmailSender(deliveryConfig).sendEmail(composeResumeRequestEmail(record, reviewLink));
  return {
    status: 'waiting',
    invalidFields: [],
    pendingRequest: { requestId: record.id, requesterToken },
  };
}

export async function requestResume(
  previousState: ResumeRequestFormState,
  formData: FormData,
): Promise<ResumeRequestFormState> {
  const submissionCount = previousState.submissionCount + 1;
  const submittedValues = readSubmittedValues(formData);
  try {
    const outcome = await createRequest(formData, submittedValues);
    const values =
      outcome.status === 'waiting'
        ? emptyResumeRequestFieldValues
        : capEchoedValues(submittedValues);
    return { ...outcome, values, submissionCount };
  } catch (requestError) {
    console.error('[resume-request] Creating the request failed:', requestError);
    return { ...failedOutcome, values: capEchoedValues(submittedValues), submissionCount };
  }
}
