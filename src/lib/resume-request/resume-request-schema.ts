import { z } from 'zod';
import { stripLineBreaks } from '../contact/contact-fields';
import {
  resumeRequestFieldLimits,
  resumeRequestFieldNames,
  type ResumeRequestFieldName,
  type ResumeRequestFieldValues,
} from './resume-request-fields';

export const resumeRequestSchema = z.object({
  name: z
    .string()
    .transform((name) => stripLineBreaks(name).trim())
    .pipe(
      z
        .string()
        .min(resumeRequestFieldLimits.name.minLength)
        .max(resumeRequestFieldLimits.name.maxLength),
    ),
  email: z.string().trim().pipe(z.email().max(resumeRequestFieldLimits.email.maxLength)),
  note: z
    .string()
    .trim()
    .max(resumeRequestFieldLimits.note.maxLength)
    .transform((note) => (note === '' ? undefined : note)),
});

export type ResumeRequestSubmission = z.output<typeof resumeRequestSchema>;

export type ResumeRequestParseResult =
  | { isValid: true; submission: ResumeRequestSubmission }
  | { isValid: false; invalidFields: ResumeRequestFieldName[] };

export function parseResumeRequest(
  submittedValues: ResumeRequestFieldValues,
): ResumeRequestParseResult {
  const parseResult = resumeRequestSchema.safeParse(submittedValues);
  if (parseResult.success) {
    return { isValid: true, submission: parseResult.data };
  }
  const invalidFieldNames = new Set(parseResult.error.issues.map((issue) => issue.path[0]));
  return {
    isValid: false,
    invalidFields: resumeRequestFieldNames.filter((fieldName) => invalidFieldNames.has(fieldName)),
  };
}

export function readCountryCode(countryHeader: string | null): string | undefined {
  const countryCode = countryHeader?.trim().toUpperCase();
  return countryCode && /^[A-Z]{2}$/.test(countryCode) ? countryCode : undefined;
}
