import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resolveRequestServices,
  type RequestServices,
} from '@/features/request-store/request-services';
import { publishedResumeKey, type PublishedResume } from '@/lib/request-store/store-keys';
import { requesterTokenHeaderName } from '@/lib/resume-request/resume-request-fields';
import { useMemoryRequestStore, useUnconfiguredRequestStore } from '../../../test/request-services';
import { respondWithResumeDownload } from './resume-download-handler';
import { respondWithResumeRequestStatus } from './resume-request-status-handler';

const downloadOptions = { fileName: 'Ada_Example_CV.pdf', currentContentHash: 'current-hash' };
const publishedResume: PublishedResume = {
  pdfBase64: Buffer.from('%PDF-1.7 resume').toString('base64'),
  contentHash: 'current-hash',
  generatedAt: '2026-11-15T00:00:00.000Z',
};

async function requireServices(): Promise<RequestServices> {
  const servicesResult = await resolveRequestServices();
  if (!servicesResult.isAvailable) {
    throw new Error(servicesResult.problem);
  }
  return servicesResult.services;
}

async function createRequest() {
  const { repository } = await requireServices();
  return repository.create({ name: 'Jane Doe', email: 'jane@example.com' }, 60_000);
}

function readStatus(requestId: string, requesterToken?: string, clientIp = '203.0.113.7') {
  const requestHeaders = new Headers({ 'x-forwarded-for': clientIp });
  if (requesterToken) {
    requestHeaders.set(requesterTokenHeaderName, requesterToken);
  }
  return respondWithResumeRequestStatus(
    new Request(`http://localhost/api/resume-requests/${requestId}/status`, {
      headers: requestHeaders,
    }),
    requestId,
  );
}

function download(grant: string | undefined) {
  const downloadUrl = new URL('http://localhost/api/resume/download');
  if (grant) {
    downloadUrl.searchParams.set('grant', grant);
  }
  return respondWithResumeDownload(new Request(downloadUrl), downloadOptions);
}

async function approveAndReadGrant() {
  const { repository } = await requireServices();
  const { record, requesterToken, approvalToken } = await createRequest();
  await repository.decide(record.id, approvalToken, 'approved');
  const statusBody = (await (await readStatus(record.id, requesterToken)).json()) as {
    grant?: string;
  };
  return statusBody.grant;
}

function expectPrivateHeaders(response: Response) {
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('x-robots-tag')).toBe('noindex');
}

describe('resume request route handlers', () => {
  beforeEach(() => {
    useMemoryRequestStore();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('status', () => {
    it('reports a pending request privately, without a grant', async () => {
      const { record, requesterToken } = await createRequest();

      const response = await readStatus(record.id, requesterToken);

      expect(response.status).toBe(200);
      expectPrivateHeaders(response);
      expect(await response.json()).toEqual({ status: 'pending' });
    });

    it('answers 404 to a wrong or missing requester token', async () => {
      const { record, approvalToken } = await createRequest();

      const wrongTokenResponse = await readStatus(record.id, approvalToken);
      expect(wrongTokenResponse.status).toBe(404);
      expectPrivateHeaders(wrongTokenResponse);
      expect((await readStatus(record.id)).status).toBe(404);
    });

    it('carries a download grant once the request is approved', async () => {
      expect(await approveAndReadGrant()).toMatch(/^[\w-]{43}$/);
    });

    it('reports denied and expired requests', async () => {
      const { repository } = await requireServices();
      const deniedRequest = await createRequest();
      await repository.decide(deniedRequest.record.id, deniedRequest.approvalToken, 'denied');
      const expiredRequest = await repository.create(
        { name: 'John Doe', email: 'john@example.com' },
        -1,
      );

      const deniedBody: unknown = await (
        await readStatus(deniedRequest.record.id, deniedRequest.requesterToken)
      ).json();
      const expiredBody: unknown = await (
        await readStatus(expiredRequest.record.id, expiredRequest.requesterToken)
      ).json();
      expect([deniedBody, expiredBody]).toEqual([{ status: 'denied' }, { status: 'expired' }]);
    });

    it('limits polling per IP', async () => {
      const { record, requesterToken } = await createRequest();
      for (let pollIndex = 0; pollIndex < 120; pollIndex += 1) {
        await readStatus(record.id, requesterToken, '198.51.100.4');
      }

      const limitedResponse = await readStatus(record.id, requesterToken, '198.51.100.4');

      expect(limitedResponse.status).toBe(429);
      expectPrivateHeaders(limitedResponse);
    });

    it('fails closed with a server log when Redis is not configured', async () => {
      useUnconfiguredRequestStore();

      const response = await readStatus('x'.repeat(22), 'y'.repeat(43));

      expect(response.status).toBe(503);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/^\[resume-request\] The request store is not configured\./),
      );
    });

    it('answers 503 when the store errors', async () => {
      const services = await requireServices();
      vi.spyOn(services.repository, 'findForRequester').mockRejectedValue(new Error('Redis down'));

      expect((await readStatus('x'.repeat(22), 'y'.repeat(43))).status).toBe(503);
    });
  });

  describe('download', () => {
    it('streams the published PDF as an attachment, three times at most', async () => {
      const { store } = await requireServices();
      await store.writeJson(publishedResumeKey, publishedResume);
      const grant = await approveAndReadGrant();

      const response = await download(grant);

      expect(response.status).toBe(200);
      expectPrivateHeaders(response);
      expect(response.headers.get('content-type')).toBe('application/pdf');
      expect(response.headers.get('content-disposition')).toBe(
        'attachment; filename="Ada_Example_CV.pdf"',
      );
      expect(Buffer.from(await response.arrayBuffer()).toString()).toBe('%PDF-1.7 resume');
      expect((await download(grant)).status).toBe(200);
      expect((await download(grant)).status).toBe(200);

      const usedUpResponse = await download(grant);
      expect(usedUpResponse.status).toBe(404);
      expect(await usedUpResponse.text()).toBe('This download link has been used up.');
    });

    it('rejects missing and unknown grants', async () => {
      const missingResponse = await download(undefined);

      expect(missingResponse.status).toBe(404);
      expectPrivateHeaders(missingResponse);
      expect(await missingResponse.text()).toBe('This download link has expired.');
      expect((await download('z'.repeat(43))).status).toBe(404);
    });

    it('fails closed, keeping the grant, when no PDF is published', async () => {
      const grant = await approveAndReadGrant();

      const response = await download(grant);

      expect(response.status).toBe(503);
      expect(console.error).toHaveBeenCalledWith(
        '[resume-request] No resume PDF is published. Run `npm run resume:publish`.',
      );
      const { store } = await requireServices();
      await store.writeJson(publishedResumeKey, publishedResume);
      expect((await download(grant)).status).toBe(200);
    });

    it('still serves a stale PDF but warns that it needs republishing', async () => {
      const { store } = await requireServices();
      await store.writeJson(publishedResumeKey, { ...publishedResume, contentHash: 'old-hash' });

      expect((await download(await approveAndReadGrant())).status).toBe(200);
      expect(console.warn).toHaveBeenCalledWith(
        '[resume-request] The published PDF is older than the content; republish it.',
      );
    });

    it('fails closed when Redis is not configured or errors', async () => {
      const services = await requireServices();
      vi.spyOn(services.repository, 'findGrantedRequestId').mockRejectedValue(
        new Error('Redis down'),
      );
      expect((await download('z'.repeat(43))).status).toBe(503);

      useUnconfiguredRequestStore();
      expect((await download('z'.repeat(43))).status).toBe(503);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/^\[resume-request\] The request store is not configured\./),
      );
    });
  });
});
