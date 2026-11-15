import { stripLineBreaks } from './contact-fields';
import type { ContactMessage } from './contact-message-schema';

export interface ContactEmail {
  subject: string;
  replyTo: string;
  text: string;
}

export function composeContactEmail(message: ContactMessage): ContactEmail {
  const senderName = stripLineBreaks(message.name).trim();
  return {
    subject: `Portfolio contact from ${senderName}`,
    replyTo: message.email,
    text: [`Name: ${senderName}`, `Email: ${message.email}`, '', message.message].join('\n'),
  };
}
