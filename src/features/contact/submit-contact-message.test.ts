import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { useMemoryRequestStore, useUnconfiguredRequestStore } from '../../../test/request-services';
import { initialContactFormState } from './contact-form-state';
import { submitContactMessage } from './submit-contact-message';

const { checkBotId, sendEmail, requestHeaders } = vi.hoisted(() => ({
  checkBotId: vi.fn(),
  sendEmail: vi.fn(),
  requestHeaders: { current: new Headers() },
}));

vi.mock('botid/server', () => ({ checkBotId }));
vi.mock('next/headers', () => ({ headers: () => Promise.resolve(requestHeaders.current) }));
vi.mock('resend', () => ({
  Resend: vi.fn(function FakeResend() {
    return { emails: { send: sendEmail } };
  }),
}));

const validFields = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  message: 'I would like to talk about a contract project.',
};

function buildFormData(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    formData.set(fieldName, fieldValue);
  }
  return formData;
}

function submit(fields: Record<string, string>, previousState = initialContactFormState) {
  return submitContactMessage(previousState, buildFormData(fields));
}

describe('submitContactMessage', () => {
  let consoleInfo: MockInstance<typeof console.info>;
  let consoleError: MockInstance<typeof console.error>;
  let consoleWarn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    vi.stubEnv('CONTACT_DELIVERY', 'log');
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('CONTACT_TO_EMAIL', '');
    useMemoryRequestStore();
    requestHeaders.current = new Headers({ 'x-forwarded-for': '203.0.113.7' });
    checkBotId.mockReset().mockResolvedValue({ isBot: false });
    sendEmail.mockReset().mockResolvedValue({ data: { id: 'email-id' }, error: null });
    consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('logs a valid message in log mode and clears the form', async () => {
    const formState = await submit({ ...validFields, name: ' Jane\r\nDoe ' });

    expect(formState).toEqual({
      status: 'sent',
      invalidFields: [],
      values: { name: '', email: '', message: '' },
      submissionCount: 1,
    });
    expect(checkBotId).toHaveBeenCalledTimes(1);
    expect(consoleInfo).toHaveBeenCalledTimes(1);
    expect(consoleInfo.mock.calls[0]?.[0]).toBe(
      [
        '[email] CONTACT_DELIVERY=log, so this email was logged, not sent:',
        'Subject: Portfolio contact from Jane Doe',
        'Reply-To: jane@example.com',
        '',
        'Name: Jane Doe',
        'Email: jane@example.com',
        '',
        'I would like to talk about a contract project.',
      ].join('\n'),
    );
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns invalid fields with the submitted values and sends nothing', async () => {
    const formState = await submit(
      { name: 'J', email: 'jane@example.com', message: 'Too short' },
      { ...initialContactFormState, submissionCount: 4 },
    );

    expect(formState).toEqual({
      status: 'invalid',
      invalidFields: ['name', 'message'],
      values: { name: 'J', email: 'jane@example.com', message: 'Too short' },
      submissionCount: 5,
    });
    expect(consoleInfo).not.toHaveBeenCalled();
  });

  it('treats missing and non-text fields as empty', async () => {
    const formData = new FormData();
    formData.set('name', new Blob(['Jane Doe']));

    const formState = await submitContactMessage(initialContactFormState, formData);

    expect(formState.status).toBe('invalid');
    expect(formState.invalidFields).toEqual(['name', 'email', 'message']);
    expect(formState.values).toEqual({ name: '', email: '', message: '' });
  });

  it('echoes at most each field limit back to the browser', async () => {
    const formState = await submit({ ...validFields, message: 'm'.repeat(6000) });

    expect(formState.invalidFields).toEqual(['message']);
    expect(formState.values.message).toHaveLength(5000);
  });

  it('reports success for a filled honeypot without sending anything', async () => {
    const formState = await submit({ ...validFields, company_website: 'https://spam.example' });

    expect(formState.status).toBe('sent');
    expect(formState.values).toEqual({ name: '', email: '', message: '' });
    expect(consoleInfo).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('fails without sending when BotID reports a bot', async () => {
    checkBotId.mockResolvedValue({ isBot: true });

    const formState = await submit(validFields);

    expect(formState).toEqual({
      status: 'failed',
      invalidFields: [],
      values: validFields,
      submissionCount: 1,
    });
    expect(consoleWarn).toHaveBeenCalledWith(
      '[contact] BotID classified the submission as a bot; nothing was sent.',
    );
    expect(consoleInfo).not.toHaveBeenCalled();
  });

  it('fails without sending when the BotID check itself errors', async () => {
    checkBotId.mockRejectedValue(new Error('BotID unavailable'));

    const formState = await submit(validFields);

    expect(formState.status).toBe('failed');
    expect(consoleError).toHaveBeenCalledWith(
      '[contact] Sending the message failed:',
      expect.objectContaining({ message: 'BotID unavailable' }),
    );
    expect(consoleInfo).not.toHaveBeenCalled();
  });

  it('fails with a server-side error when Resend is not configured', async () => {
    vi.stubEnv('CONTACT_DELIVERY', '');

    const formState = await submit(validFields);

    expect(formState).toEqual({
      status: 'failed',
      invalidFields: [],
      values: validFields,
      submissionCount: 1,
    });
    expect(consoleError).toHaveBeenCalledWith(
      '[contact] Email delivery is not configured. Set RESEND_API_KEY and CONTACT_TO_EMAIL, or CONTACT_DELIVERY=log for local runs.',
    );
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('sends through Resend when it is configured', async () => {
    vi.stubEnv('CONTACT_DELIVERY', 'resend');
    vi.stubEnv('RESEND_API_KEY', 're_test_placeholder');
    vi.stubEnv('CONTACT_TO_EMAIL', 'inbox@example.com');

    const formState = await submit(validFields);

    expect(formState.status).toBe('sent');
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'inbox@example.com', replyTo: 'jane@example.com' }),
    );
  });

  it('fails and keeps the values when Resend rejects the message', async () => {
    vi.stubEnv('CONTACT_DELIVERY', 'resend');
    vi.stubEnv('RESEND_API_KEY', 're_test_placeholder');
    vi.stubEnv('CONTACT_TO_EMAIL', 'inbox@example.com');
    sendEmail.mockResolvedValue({
      data: null,
      error: { name: 'rate_limit_exceeded', message: 'Too many requests.', statusCode: 429 },
    });

    const formState = await submit(validFields);

    expect(formState).toEqual({
      status: 'failed',
      invalidFields: [],
      values: validFields,
      submissionCount: 1,
    });
    expect(consoleError).toHaveBeenCalledWith(
      '[contact] Sending the message failed:',
      expect.objectContaining({
        message: 'Resend rejected the email: rate_limit_exceeded (Too many requests.)',
      }),
    );
  });

  it('allows 5 messages per IP an hour, then fails without saying why', async () => {
    for (let messageIndex = 0; messageIndex < 5; messageIndex += 1) {
      expect((await submit(validFields)).status).toBe('sent');
    }

    const formState = await submit(validFields);

    expect(formState.status).toBe('failed');
    expect(formState.values).toEqual(validFields);
    expect(consoleWarn).toHaveBeenCalledWith(
      '[contact] A rate limit was reached; nothing was sent.',
    );
    expect(consoleInfo).toHaveBeenCalledTimes(5);

    requestHeaders.current = new Headers({ 'x-forwarded-for': '198.51.100.4' });
    expect((await submit(validFields)).status).toBe('sent');
  });

  it('skips the limit with a server log when Redis is not configured', async () => {
    useUnconfiguredRequestStore();

    for (let messageIndex = 0; messageIndex < 6; messageIndex += 1) {
      expect((await submit(validFields)).status).toBe('sent');
    }
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringMatching(/^\[contact\] Rate limit skipped: Set KV_REST_API_URL/),
    );
  });

  it('still sends when the rate limit check itself errors', async () => {
    useMemoryRequestStore({ RESUME_REQUEST_FIXTURE_PDF: 'missing-fixture.pdf' });

    expect((await submit(validFields)).status).toBe('sent');
    expect(consoleError).toHaveBeenCalledWith(
      '[contact] Rate limit check failed; the message is allowed:',
      expect.objectContaining({ code: 'ENOENT' }),
    );
  });
});
