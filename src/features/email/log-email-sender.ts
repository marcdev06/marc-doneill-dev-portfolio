import { appendFile } from 'node:fs/promises';
import type { EmailSender } from './email-sender';

interface LogEmailSenderOptions {
  logFilePath?: string;
  writeLogLine?: (logLine: string) => void;
}

export function createLogEmailSender({
  logFilePath,
  writeLogLine = console.info,
}: LogEmailSenderOptions = {}): EmailSender {
  return {
    async sendEmail(email) {
      const loggedEmail = [
        '[email] CONTACT_DELIVERY=log, so this email was logged, not sent:',
        `Subject: ${email.subject}`,
        `Reply-To: ${email.replyTo}`,
        '',
        email.text,
      ].join('\n');
      writeLogLine(loggedEmail);
      if (logFilePath) {
        await appendFile(logFilePath, `${loggedEmail}\n\n`);
      }
    },
  };
}
