import { composeContactEmail } from '@/lib/contact/contact-email';
import type { ContactSender } from './contact-sender';

type WriteLogLine = (logLine: string) => void;

export function createLogSender(writeLogLine: WriteLogLine = console.info): ContactSender {
  return {
    sendContactMessage(message) {
      const email = composeContactEmail(message);
      writeLogLine(
        [
          '[contact] CONTACT_DELIVERY=log, so this message was logged, not sent:',
          `Subject: ${email.subject}`,
          `Reply-To: ${email.replyTo}`,
          '',
          email.text,
        ].join('\n'),
      );
      return Promise.resolve();
    },
  };
}
