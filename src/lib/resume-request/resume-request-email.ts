import { stripLineBreaks } from '../contact/contact-fields';
import type { OutgoingEmail } from '../email/outgoing-email';
import { formatManilaTime } from './manila-time';
import type { ResumeRequestRecord } from './resume-request-repository';

export function composeResumeRequestEmail(
  record: ResumeRequestRecord,
  reviewLink: string,
): OutgoingEmail {
  const requesterName = stripLineBreaks(record.name).trim();
  return {
    subject: `Resume request from ${requesterName}`,
    replyTo: record.email,
    text: [
      `${requesterName} asked for your resume on your portfolio site.`,
      '',
      `Name: ${requesterName}`,
      `Email: ${record.email}`,
      `Country: ${record.country ?? 'Unknown'}`,
      `Note: ${record.note ?? '(none)'}`,
      '',
      `Requested: ${formatManilaTime(record.createdAtMs)}`,
      `Their window waits until: ${formatManilaTime(record.decideByMs)}`,
      'After that, reply to this email instead. The details are deleted after 24 hours.',
      '',
      'Approve or deny it here:',
      reviewLink,
    ].join('\n'),
  };
}
