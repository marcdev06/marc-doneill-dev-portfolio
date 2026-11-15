import {
  emptyContactFieldValues,
  type ContactFieldName,
  type ContactFieldValues,
} from '@/lib/contact/contact-fields';

export type ContactFormStatus = 'idle' | 'invalid' | 'sent' | 'failed';

export interface ContactFormState {
  status: ContactFormStatus;
  invalidFields: ContactFieldName[];
  values: ContactFieldValues;
  submissionCount: number;
}

export const initialContactFormState: ContactFormState = {
  status: 'idle',
  invalidFields: [],
  values: emptyContactFieldValues,
  submissionCount: 0,
};
