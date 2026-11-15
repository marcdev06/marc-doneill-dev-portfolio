export const contactFieldNames = ['name', 'email', 'message'] as const;

export type ContactFieldName = (typeof contactFieldNames)[number];

export type ContactFieldValues = Record<ContactFieldName, string>;

export const contactFieldLimits = {
  name: { minLength: 2, maxLength: 100 },
  email: { maxLength: 254 },
  message: { minLength: 20, maxLength: 5000 },
} as const;

export const contactHoneypotFieldName = 'company_website';

export const emptyContactFieldValues: ContactFieldValues = { name: '', email: '', message: '' };

export function stripLineBreaks(text: string): string {
  return text.replace(/[\r\n]+/g, ' ');
}
