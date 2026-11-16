import type { ContactDeliveryConfig } from '@/lib/contact/contact-delivery-config';
import type { OutgoingEmail } from '@/lib/email/outgoing-email';
import { createLogEmailSender } from './log-email-sender';
import { createResendEmailSender } from './resend-email-sender';

export interface EmailSender {
  sendEmail(email: OutgoingEmail): Promise<void>;
}

export type ConfiguredEmailDelivery = Exclude<ContactDeliveryConfig, { mode: 'unconfigured' }>;

export function createEmailSender(deliveryConfig: ConfiguredEmailDelivery): EmailSender {
  return deliveryConfig.mode === 'log'
    ? createLogEmailSender({ logFilePath: deliveryConfig.logFilePath })
    : createResendEmailSender(deliveryConfig);
}
