import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createResendEmailSender } from './resend-email-sender';

const { constructResend, sendEmail } = vi.hoisted(() => ({
  constructResend: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: vi.fn(function FakeResend(apiKey: string) {
    constructResend(apiKey);
    return { emails: { send: sendEmail } };
  }),
}));

const deliveryConfig = {
  mode: 'resend',
  apiKey: 're_test_placeholder',
  toAddress: 'inbox@example.com',
  fromAddress: 'Portfolio contact <onboarding@resend.dev>',
} as const;

const outgoingEmail = {
  subject: 'Portfolio contact from Jane Doe',
  replyTo: 'jane@example.com',
  text: 'Name: Jane Doe\nEmail: jane@example.com\n\nHello Marc, <b>let us</b> talk.',
};

describe('createResendEmailSender', () => {
  beforeEach(() => {
    constructResend.mockReset();
    sendEmail.mockReset();
  });

  it('sends a plain-text email to Marc that replies to the visitor', async () => {
    sendEmail.mockResolvedValue({ data: { id: 'email-id' }, error: null });

    await createResendEmailSender(deliveryConfig).sendEmail(outgoingEmail);

    expect(constructResend).toHaveBeenCalledWith('re_test_placeholder');
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith({
      from: 'Portfolio contact <onboarding@resend.dev>',
      to: 'inbox@example.com',
      ...outgoingEmail,
    });
    expect(sendEmail.mock.calls[0]?.[0]).not.toHaveProperty('html');
    expect(sendEmail.mock.calls[0]?.[0]).not.toHaveProperty('react');
  });

  it('throws when Resend reports an error', async () => {
    sendEmail.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', message: 'Invalid `to` field.', statusCode: 422 },
    });

    await expect(createResendEmailSender(deliveryConfig).sendEmail(outgoingEmail)).rejects.toThrow(
      'Resend rejected the email: validation_error (Invalid `to` field.)',
    );
  });
});
