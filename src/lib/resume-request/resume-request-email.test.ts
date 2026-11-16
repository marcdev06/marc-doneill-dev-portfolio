import { describe, expect, it } from 'vitest';
import { formatManilaTime } from './manila-time';
import { composeResumeRequestEmail } from './resume-request-email';
import type { ResumeRequestRecord } from './resume-request-repository';

const createdAtMs = Date.UTC(2026, 10, 15, 7, 4);

const record: ResumeRequestRecord = {
  id: 'abc',
  requesterTokenHash: 'requester-hash',
  approvalTokenHash: 'approval-hash',
  name: 'Jane Doe',
  email: 'jane@example.com',
  note: 'Hiring for a contract role.',
  country: 'PH',
  createdAtMs,
  decideByMs: createdAtMs + 15 * 60 * 1000,
};

const reviewLink = 'https://example.com/resume-requests/abc?token=secret';

describe('formatManilaTime', () => {
  it('formats epoch milliseconds in Manila time', () => {
    expect(formatManilaTime(createdAtMs)).toBe('15 Nov 2026, 15:04 (Manila time)');
  });
});

describe('composeResumeRequestEmail', () => {
  it('builds a plain-text email with the details, times and review link', () => {
    expect(composeResumeRequestEmail(record, reviewLink)).toEqual({
      subject: 'Resume request from Jane Doe',
      replyTo: 'jane@example.com',
      text: [
        'Jane Doe asked for your resume on your portfolio site.',
        '',
        'Name: Jane Doe',
        'Email: jane@example.com',
        'Country: PH',
        'Note: Hiring for a contract role.',
        '',
        'Requested: 15 Nov 2026, 15:04 (Manila time)',
        'Their window waits until: 15 Nov 2026, 15:19 (Manila time)',
        'After that, reply to this email instead. The details are deleted after 24 hours.',
        '',
        'Approve or deny it here:',
        reviewLink,
      ].join('\n'),
    });
  });

  it('marks a missing note and country, and keeps line breaks out of the subject', () => {
    const email = composeResumeRequestEmail(
      { ...record, name: 'Jane\r\nBcc: victim@example.com', note: undefined, country: undefined },
      reviewLink,
    );

    expect(email.subject).toBe('Resume request from Jane Bcc: victim@example.com');
    expect(email.text).toContain('Country: Unknown\nNote: (none)');
  });
});
