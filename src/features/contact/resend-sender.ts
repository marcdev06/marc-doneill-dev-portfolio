import { Resend } from 'resend';
import type { ContactDeliveryConfig } from '@/lib/contact/contact-delivery-config';
import { composeContactEmail } from '@/lib/contact/contact-email';
import type { ContactSender } from './contact-sender';

type ResendDeliveryConfig = Extract<ContactDeliveryConfig, { mode: 'resend' }>;

export function createResendSender({
  apiKey,
  toAddress,
  fromAddress,
}: ResendDeliveryConfig): ContactSender {
  const resendClient = new Resend(apiKey);
  return {
    async sendContactMessage(message) {
      const email = composeContactEmail(message);
      const { error } = await resendClient.emails.send({
        from: fromAddress,
        to: toAddress,
        replyTo: email.replyTo,
        subject: email.subject,
        text: email.text,
      });
      if (error) {
        throw new Error(`Resend rejected the message: ${error.name} (${error.message})`);
      }
    },
  };
}
