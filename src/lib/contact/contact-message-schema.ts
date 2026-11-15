import { z } from 'zod';
import {
  contactFieldLimits,
  contactFieldNames,
  stripLineBreaks,
  type ContactFieldName,
  type ContactFieldValues,
} from './contact-fields';

export const contactMessageSchema = z.object({
  name: z
    .string()
    .transform((name) => stripLineBreaks(name).trim())
    .pipe(z.string().min(contactFieldLimits.name.minLength).max(contactFieldLimits.name.maxLength)),
  email: z.string().trim().pipe(z.email().max(contactFieldLimits.email.maxLength)),
  message: z
    .string()
    .trim()
    .min(contactFieldLimits.message.minLength)
    .max(contactFieldLimits.message.maxLength),
});

export type ContactMessage = z.output<typeof contactMessageSchema>;

export type ContactSubmissionResult =
  | { isValid: true; message: ContactMessage }
  | { isValid: false; invalidFields: ContactFieldName[] };

export function parseContactSubmission(
  submittedValues: ContactFieldValues,
): ContactSubmissionResult {
  const parseResult = contactMessageSchema.safeParse(submittedValues);
  if (parseResult.success) {
    return { isValid: true, message: parseResult.data };
  }
  const invalidFieldNames = new Set(parseResult.error.issues.map((issue) => issue.path[0]));
  return {
    isValid: false,
    invalidFields: contactFieldNames.filter((fieldName) => invalidFieldNames.has(fieldName)),
  };
}
