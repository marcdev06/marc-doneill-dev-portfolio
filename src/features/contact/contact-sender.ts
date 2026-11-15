import type { ContactDeliveryConfig } from '@/lib/contact/contact-delivery-config';
import type { ContactMessage } from '@/lib/contact/contact-message-schema';
import { createLogSender } from './log-sender';
import { createResendSender } from './resend-sender';

export interface ContactSender {
  sendContactMessage(message: ContactMessage): Promise<void>;
}

export type ConfiguredContactDelivery = Exclude<ContactDeliveryConfig, { mode: 'unconfigured' }>;

export function createContactSender(deliveryConfig: ConfiguredContactDelivery): ContactSender {
  return deliveryConfig.mode === 'log' ? createLogSender() : createResendSender(deliveryConfig);
}
