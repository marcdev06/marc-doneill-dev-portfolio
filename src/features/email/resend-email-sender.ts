import { Resend } from 'resend';
import type { ContactDeliveryConfig } from '@/lib/contact/contact-delivery-config';
import type { EmailSender } from './email-sender';

type ResendDeliveryConfig = Extract<ContactDeliveryConfig, { mode: 'resend' }>;

export function createResendEmailSender({
  apiKey,
  toAddress,
  fromAddress,
}: ResendDeliveryConfig): EmailSender {
  const resendClient = new Resend(apiKey);
  return {
    async sendEmail(email) {
      const { error } = await resendClient.emails.send({
        from: fromAddress,
        to: toAddress,
        replyTo: email.replyTo,
        subject: email.subject,
        text: email.text,
      });
      if (error) {
        throw new Error(`Resend rejected the email: ${error.name} (${error.message})`);
      }
    },
  };
}
