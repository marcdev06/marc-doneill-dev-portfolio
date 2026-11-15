import type { OutgoingEmail } from '../email/outgoing-email';
import { stripLineBreaks } from './contact-fields';
import type { ContactMessage } from './contact-message-schema';

export function composeContactEmail(message: ContactMessage): OutgoingEmail {
  const senderName = stripLineBreaks(message.name).trim();
  return {
    subject: `Portfolio contact from ${senderName}`,
    replyTo: message.email,
    text: [`Name: ${senderName}`, `Email: ${message.email}`, '', message.message].join('\n'),
  };
}
