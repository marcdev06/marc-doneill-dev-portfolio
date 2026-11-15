import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createResendSender } from './resend-sender';

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

describe('createResendSender', () => {
  beforeEach(() => {
    constructResend.mockReset();
    sendEmail.mockReset();
  });

  it('sends a plain-text email that replies to the visitor', async () => {
    sendEmail.mockResolvedValue({ data: { id: 'email-id' }, error: null });

    await createResendSender(deliveryConfig).sendContactMessage({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello Marc, <b>let us</b> talk about a project.',
    });

    expect(constructResend).toHaveBeenCalledWith('re_test_placeholder');
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith({
      from: 'Portfolio contact <onboarding@resend.dev>',
      to: 'inbox@example.com',
      replyTo: 'jane@example.com',
      subject: 'Portfolio contact from Jane Doe',
      text: 'Name: Jane Doe\nEmail: jane@example.com\n\nHello Marc, <b>let us</b> talk about a project.',
    });
    expect(sendEmail.mock.calls[0]?.[0]).not.toHaveProperty('html');
    expect(sendEmail.mock.calls[0]?.[0]).not.toHaveProperty('react');
  });

  it('strips line breaks from the subject', async () => {
    sendEmail.mockResolvedValue({ data: { id: 'email-id' }, error: null });

    await createResendSender(deliveryConfig).sendContactMessage({
      name: 'Jane\r\nBcc: victim@example.com',
      email: 'jane@example.com',
      message: 'A message long enough to send.',
    });

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Portfolio contact from Jane Bcc: victim@example.com' }),
    );
  });

  it('throws when Resend reports an error', async () => {
    sendEmail.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', message: 'Invalid `to` field.', statusCode: 422 },
    });

    await expect(
      createResendSender(deliveryConfig).sendContactMessage({
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'A message long enough to send.',
      }),
    ).rejects.toThrow('Resend rejected the message: validation_error (Invalid `to` field.)');
  });
});
