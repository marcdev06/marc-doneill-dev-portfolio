import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { resolveRequestServices } from '@/features/request-store/request-services';
import { useMemoryRequestStore, useUnconfiguredRequestStore } from '../../../test/request-services';
import { requestResume } from './request-resume';
import {
  initialResumeRequestFormState,
  type ResumeRequestFormState,
} from './resume-request-form-state';

const { checkBotId, requestHeaders } = vi.hoisted(() => ({
  checkBotId: vi.fn(),
  requestHeaders: { current: new Headers() },
}));

vi.mock('botid/server', () => ({ checkBotId }));
vi.mock('next/headers', () => ({ headers: () => Promise.resolve(requestHeaders.current) }));

const validFields = { name: 'Jane Doe', email: 'jane@example.com', note: 'A contract role.' };

function buildFormData(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    formData.set(fieldName, fieldValue);
  }
  return formData;
}

function submit(fields: Record<string, string>, previousState = initialResumeRequestFormState) {
  return requestResume(previousState, buildFormData(fields));
}

function readLoggedEmail(consoleInfo: MockInstance<typeof console.info>): string {
  const loggedEmail: unknown = consoleInfo.mock.calls.at(-1)?.[0];
  if (typeof loggedEmail !== 'string') {
    throw new Error('No email was logged');
  }
  return loggedEmail;
}

async function readStoredView(formState: ResumeRequestFormState) {
  const servicesResult = await resolveRequestServices();
  if (!servicesResult.isAvailable || !formState.pendingRequest) {
    throw new Error('Expected a stored request');
  }
  const { requestId, requesterToken } = formState.pendingRequest;
  return servicesResult.services.repository.findForRequester(requestId, requesterToken);
}

describe('requestResume', () => {
  let consoleInfo: MockInstance<typeof console.info>;
  let consoleWarn: MockInstance<typeof console.warn>;
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    useMemoryRequestStore();
    vi.stubEnv('CONTACT_DELIVERY', 'log');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://marc.example.com');
    vi.stubEnv('VERCEL_ENV', '');
    requestHeaders.current = new Headers({
      'x-forwarded-for': '203.0.113.7',
      'x-vercel-ip-country': 'PH',
    });
    checkBotId.mockReset().mockResolvedValue({ isBot: false });
    consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('stores a pending request, emails Marc the review link and starts waiting', async () => {
    const formState = await submit({ ...validFields, name: ' Jane\r\nDoe ' });

    expect(formState).toMatchObject({
      status: 'waiting',
      invalidFields: [],
      values: { name: '', email: '', note: '' },
      submissionCount: 1,
    });
    expect(formState.pendingRequest?.requestId).toMatch(/^[\w-]{22}$/);
    expect(formState.pendingRequest?.requesterToken).toMatch(/^[\w-]{43}$/);

    const view = await readStoredView(formState);
    expect(view).toMatchObject({
      status: 'pending',
      record: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        note: 'A contract role.',
        country: 'PH',
      },
    });

    const loggedEmail = readLoggedEmail(consoleInfo);
    expect(loggedEmail).toContain('Subject: Resume request from Jane Doe');
    expect(loggedEmail).toContain('Reply-To: jane@example.com');
    expect(loggedEmail).toMatch(
      new RegExp(
        `^https://marc\\.example\\.com/resume-requests/${formState.pendingRequest?.requestId ?? ''}\\?token=[\\w-]{43}$`,
        'm',
      ),
    );
    expect(loggedEmail).not.toContain(formState.pendingRequest?.requesterToken);
  });

  it('links previews to their own branch URL', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('VERCEL_BRANCH_URL', 'portfolio-git-staging-marcdev06.vercel.app');

    await submit(validFields);

    expect(readLoggedEmail(consoleInfo)).toMatch(
      /^https:\/\/portfolio-git-staging-marcdev06\.vercel\.app\/resume-requests\//m,
    );
  });

  it('returns the invalid fields and echoes capped values', async () => {
    const formState = await submit({ name: 'J', email: 'jane@example', note: 'n'.repeat(900) });

    expect(formState).toEqual({
      status: 'invalid',
      invalidFields: ['name', 'email', 'note'],
      values: { name: 'J', email: 'jane@example', note: 'n'.repeat(500) },
      submissionCount: 1,
    });
    expect(consoleInfo).not.toHaveBeenCalled();
  });

  it('pretends to wait for a filled honeypot, storing and sending nothing', async () => {
    const formState = await submit({ ...validFields, company_website: 'https://spam.example' });

    expect(formState.status).toBe('waiting');
    expect(await readStoredView(formState)).toBeUndefined();
    expect(consoleInfo).not.toHaveBeenCalled();
  });

  it('fails closed when BotID reports a bot or its check errors', async () => {
    checkBotId.mockResolvedValueOnce({ isBot: true }).mockRejectedValueOnce(new Error('No OIDC'));

    expect((await submit(validFields)).status).toBe('failed');
    expect(consoleWarn).toHaveBeenCalledWith(
      '[resume-request] BotID classified the request as a bot; nothing was stored.',
    );
    const erroredState = await submit(validFields);
    expect(erroredState).toMatchObject({ status: 'failed', values: validFields });
    expect(consoleError).toHaveBeenCalledWith(
      '[resume-request] Creating the request failed:',
      expect.objectContaining({ message: 'No OIDC' }),
    );
  });

  it('allows 2 requests per email a day, without saying which limit was hit', async () => {
    expect((await submit(validFields)).status).toBe('waiting');
    requestHeaders.current = new Headers({ 'x-forwarded-for': '198.51.100.4' });
    expect((await submit(validFields)).status).toBe('waiting');
    requestHeaders.current = new Headers({ 'x-forwarded-for': '192.0.2.9' });

    const limitedState = await submit({ ...validFields, email: 'JANE@example.com' });

    expect(limitedState).toMatchObject({
      status: 'rate-limited',
      values: { email: 'JANE@example.com' },
    });
    expect(limitedState.pendingRequest).toBeUndefined();
    expect(consoleWarn).toHaveBeenCalledWith(
      '[resume-request] A rate limit was reached; nothing was stored.',
    );
  });

  it('allows 3 requests per IP a day', async () => {
    for (const requesterEmail of ['a@example.com', 'b@example.com', 'c@example.com']) {
      expect((await submit({ ...validFields, email: requesterEmail })).status).toBe('waiting');
    }

    expect((await submit({ ...validFields, email: 'd@example.com' })).status).toBe('rate-limited');
  });

  it('allows 20 requests across the site a day', async () => {
    for (let requestIndex = 0; requestIndex < 20; requestIndex += 1) {
      requestHeaders.current = new Headers({ 'x-forwarded-for': `10.0.0.${String(requestIndex)}` });
      const formState = await submit({
        ...validFields,
        email: `${String(requestIndex)}@example.com`,
      });
      expect(formState.status).toBe('waiting');
    }
    requestHeaders.current = new Headers({ 'x-forwarded-for': '10.0.1.1' });

    expect((await submit({ ...validFields, email: 'late@example.com' })).status).toBe(
      'rate-limited',
    );
  });

  it('fails closed with a server log when Redis is not configured', async () => {
    useUnconfiguredRequestStore();

    expect((await submit(validFields)).status).toBe('failed');
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\[resume-request\] The request store is not configured\. Set KV_REST_API_URL/,
      ),
    );
  });

  it('fails closed when email delivery is not configured', async () => {
    vi.stubEnv('CONTACT_DELIVERY', 'resend');
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('CONTACT_TO_EMAIL', '');

    expect((await submit(validFields)).status).toBe('failed');
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringMatching(/^\[resume-request\] Email delivery is not configured\./),
    );
  });

  it('reads missing and non-text fields as empty', async () => {
    const formData = new FormData();
    formData.set('name', new Blob(['Jane Doe']));

    const formState = await requestResume(
      { ...initialResumeRequestFormState, submissionCount: 2 },
      formData,
    );

    expect(formState).toEqual({
      status: 'invalid',
      invalidFields: ['name', 'email'],
      values: { name: '', email: '', note: '' },
      submissionCount: 3,
    });
  });
});
