// Client-safe: no zod, no node:crypto

export const resumeRequestFieldNames = ['name', 'email', 'note'] as const;

export type ResumeRequestFieldName = (typeof resumeRequestFieldNames)[number];

export type ResumeRequestFieldValues = Record<ResumeRequestFieldName, string>;

export const resumeRequestFieldLimits = {
  name: { minLength: 2, maxLength: 100 },
  email: { maxLength: 254 },
  note: { maxLength: 500 },
} as const;

export const resumeRequestHoneypotFieldName = 'company_website';

export const emptyResumeRequestFieldValues: ResumeRequestFieldValues = {
  name: '',
  email: '',
  note: '',
};

export const requesterTokenHeaderName = 'x-resume-request-token';

export type ResumeRequestStatus = 'pending' | 'approved' | 'denied' | 'expired';

export interface ResumeRequestStatusResponse {
  status: ResumeRequestStatus;
  grant?: string;
}

export function buildResumeRequestStatusPath(requestId: string): string {
  return `/api/resume-requests/${encodeURIComponent(requestId)}/status`;
}

export function buildResumeDownloadPath(grant: string): string {
  return `/api/resume/download?grant=${encodeURIComponent(grant)}`;
}
