'use server';

import { readContactDeliveryConfig } from '@/lib/contact/contact-delivery-config';
import {
  contactFieldLimits,
  contactHoneypotFieldName,
  emptyContactFieldValues,
  type ContactFieldValues,
} from '@/lib/contact/contact-fields';
import { parseContactSubmission } from '@/lib/contact/contact-message-schema';
import { isBotSubmission } from './bot-verdict';
import type { ContactFormState } from './contact-form-state';
import { createContactSender } from './contact-sender';

function readTextField(formData: FormData, fieldName: string): string {
  const fieldValue = formData.get(fieldName);
  return typeof fieldValue === 'string' ? fieldValue : '';
}

function readSubmittedValues(formData: FormData): ContactFieldValues {
  return {
    name: readTextField(formData, 'name'),
    email: readTextField(formData, 'email'),
    message: readTextField(formData, 'message'),
  };
}

// Echo at most each field's limit back to the browser
function capEchoedValues(submittedValues: ContactFieldValues): ContactFieldValues {
  return {
    name: submittedValues.name.slice(0, contactFieldLimits.name.maxLength),
    email: submittedValues.email.slice(0, contactFieldLimits.email.maxLength),
    message: submittedValues.message.slice(0, contactFieldLimits.message.maxLength),
  };
}

async function deliverSubmission(
  formData: FormData,
  submittedValues: ContactFieldValues,
): Promise<Pick<ContactFormState, 'status' | 'invalidFields'>> {
  if (await isBotSubmission()) {
    console.warn('[contact] BotID classified the submission as a bot; nothing was sent.');
    return { status: 'failed', invalidFields: [] };
  }
  if (readTextField(formData, contactHoneypotFieldName) !== '') {
    return { status: 'sent', invalidFields: [] };
  }

  const submission = parseContactSubmission(submittedValues);
  if (!submission.isValid) {
    return { status: 'invalid', invalidFields: submission.invalidFields };
  }

  const deliveryConfig = readContactDeliveryConfig(process.env);
  if (deliveryConfig.mode === 'unconfigured') {
    console.error(`[contact] Email delivery is not configured. ${deliveryConfig.problem}`);
    return { status: 'failed', invalidFields: [] };
  }
  await createContactSender(deliveryConfig).sendContactMessage(submission.message);
  return { status: 'sent', invalidFields: [] };
}

export async function submitContactMessage(
  previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const submissionCount = previousState.submissionCount + 1;
  const submittedValues = readSubmittedValues(formData);
  const echoedValues = capEchoedValues(submittedValues);
  try {
    const outcome = await deliverSubmission(formData, submittedValues);
    const values = outcome.status === 'sent' ? emptyContactFieldValues : echoedValues;
    return { ...outcome, values, submissionCount };
  } catch (deliveryError) {
    console.error('[contact] Sending the message failed:', deliveryError);
    return { status: 'failed', invalidFields: [], values: echoedValues, submissionCount };
  }
}
