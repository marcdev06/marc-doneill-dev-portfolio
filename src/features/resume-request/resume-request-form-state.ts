import {
  emptyResumeRequestFieldValues,
  type ResumeRequestFieldName,
  type ResumeRequestFieldValues,
} from '@/lib/resume-request/resume-request-fields';

export type ResumeRequestFormStatus = 'idle' | 'invalid' | 'waiting' | 'rate-limited' | 'failed';

export interface PendingResumeRequest {
  requestId: string;
  requesterToken: string;
}

export interface ResumeRequestFormState {
  status: ResumeRequestFormStatus;
  invalidFields: ResumeRequestFieldName[];
  values: ResumeRequestFieldValues;
  submissionCount: number;
  pendingRequest?: PendingResumeRequest;
}

export const initialResumeRequestFormState: ResumeRequestFormState = {
  status: 'idle',
  invalidFields: [],
  values: emptyResumeRequestFieldValues,
  submissionCount: 0,
};
