import { describe, expect, it } from 'vitest';
import { createMemoryKeyValueStore } from '../request-store/memory-key-value-store';
import { createResumeRequestRepository } from './resume-request-repository';
import {
  downloadGrantLifetimeMs,
  resumeRequestPendingWindowMs,
  resumeRequestRecordLifetimeMs,
} from './resume-request-timing';
import { hashSecretToken } from './resume-request-tokens';

const requesterDetails = { name: 'Jane Doe', email: 'jane@example.com', country: 'PH' };

function createTestRepository() {
  let nowMs = Date.UTC(2026, 10, 15, 7, 0);
  const store = createMemoryKeyValueStore(() => nowMs);
  const repository = createResumeRequestRepository(store, 'local', () => nowMs);
  return {
    store,
    repository,
    advanceBy: (elapsedMs: number) => {
      nowMs += elapsedMs;
    },
  };
}

async function createPendingRequest() {
  const testRepository = createTestRepository();
  const created = await testRepository.repository.create(
    requesterDetails,
    resumeRequestPendingWindowMs,
  );
  return { ...testRepository, ...created };
}

async function approveRequest() {
  const pendingRequest = await createPendingRequest();
  const { repository, record, approvalToken, requesterToken } = pendingRequest;
  await repository.decide(record.id, approvalToken, 'approved');
  const view = await repository.findForRequester(record.id, requesterToken);
  if (!view) {
    throw new Error('The approved request should be readable');
  }
  return { ...pendingRequest, view };
}

describe('createResumeRequestRepository', () => {
  it('waits 15 minutes for a decision', () => {
    expect(resumeRequestPendingWindowMs).toBe(15 * 60 * 1000);
  });

  it('stores a pending request with hashed tokens only', async () => {
    const { store, record, requesterToken, approvalToken } = await createPendingRequest();

    const storedRecord = await store.readJson(`local:resume-request:${record.id}`);
    expect(storedRecord).toEqual({
      ...requesterDetails,
      id: record.id,
      requesterTokenHash: hashSecretToken(requesterToken),
      approvalTokenHash: hashSecretToken(approvalToken),
      createdAtMs: record.createdAtMs,
      decideByMs: record.createdAtMs + resumeRequestPendingWindowMs,
    });
    expect(JSON.stringify(storedRecord)).not.toContain(requesterToken);
    expect(JSON.stringify(storedRecord)).not.toContain(approvalToken);
  });

  it('shows the request only to the right token for each side', async () => {
    const { repository, record, requesterToken, approvalToken } = await createPendingRequest();

    expect(await repository.findForRequester(record.id, requesterToken)).toMatchObject({
      status: 'pending',
    });
    expect(await repository.findForReviewer(record.id, approvalToken)).toMatchObject({
      status: 'pending',
    });
    expect(await repository.findForRequester(record.id, approvalToken)).toBeUndefined();
    expect(await repository.findForReviewer(record.id, requesterToken)).toBeUndefined();
    expect(await repository.findForReviewer(record.id, undefined)).toBeUndefined();
    expect(await repository.findForReviewer('not a request id', approvalToken)).toBeUndefined();
    expect(await repository.findForReviewer('x'.repeat(22), approvalToken)).toBeUndefined();
    expect(await repository.findForReviewer(record.id, 'not-a-token')).toBeUndefined();
  });

  it('expires a pending request after the window and forgets it after 24 hours', async () => {
    const { repository, record, requesterToken, approvalToken, advanceBy } =
      await createPendingRequest();

    advanceBy(resumeRequestPendingWindowMs);
    expect(await repository.findForRequester(record.id, requesterToken)).toMatchObject({
      status: 'expired',
    });
    expect(await repository.decide(record.id, approvalToken, 'approved')).toBe('expired');

    advanceBy(resumeRequestRecordLifetimeMs);
    expect(await repository.findForReviewer(record.id, approvalToken)).toBeUndefined();
  });

  it('accepts one decision only', async () => {
    const { repository, record, requesterToken, approvalToken, advanceBy } =
      await createPendingRequest();

    advanceBy(60_000);
    expect(await repository.decide(record.id, approvalToken, 'denied')).toBe('decided');
    expect(await repository.decide(record.id, approvalToken, 'approved')).toBe('already-decided');
    expect(await repository.findForRequester(record.id, requesterToken)).toMatchObject({
      status: 'denied',
      decidedAtMs: record.createdAtMs + 60_000,
    });
    expect(await repository.decide(record.id, requesterToken, 'approved')).toBe('not-found');
  });

  it('keeps the decision when two arrive at once', async () => {
    const { repository, record, approvalToken } = await createPendingRequest();

    const outcomes = await Promise.all([
      repository.decide(record.id, approvalToken, 'approved'),
      repository.decide(record.id, approvalToken, 'denied'),
    ]);

    expect(outcomes.sort()).toEqual(['already-decided', 'decided']);
  });

  it('issues no download grant before approval', async () => {
    const { repository, record, requesterToken } = await createPendingRequest();
    const view = await repository.findForRequester(record.id, requesterToken);

    expect(view && (await repository.issueDownloadGrant(view))).toBeUndefined();
  });

  it('grants three downloads within five minutes of the first grant', async () => {
    const { repository, record, view } = await approveRequest();

    const grant = await repository.issueDownloadGrant(view);
    expect(grant).toMatch(/^[\w-]{43}$/);
    expect(await repository.findGrantedRequestId(grant ?? null)).toBe(record.id);

    const downloadVerdicts = [];
    for (let downloadIndex = 0; downloadIndex < 4; downloadIndex += 1) {
      downloadVerdicts.push(await repository.consumeDownload(record.id));
    }
    expect(downloadVerdicts).toEqual([true, true, true, false]);
  });

  it('reissues grants inside the same window and use budget', async () => {
    const { repository, record, view, advanceBy } = await approveRequest();

    const firstGrant = await repository.issueDownloadGrant(view);
    await repository.consumeDownload(record.id);
    advanceBy(downloadGrantLifetimeMs - 1_000);
    const secondGrant = await repository.issueDownloadGrant(view);

    expect(secondGrant).not.toBe(firstGrant);
    expect(await repository.findGrantedRequestId(secondGrant ?? null)).toBe(record.id);
    expect(await repository.consumeDownload(record.id)).toBe(true);
    expect(await repository.consumeDownload(record.id)).toBe(true);
    expect(await repository.consumeDownload(record.id)).toBe(false);

    advanceBy(1_000);
    expect(await repository.findGrantedRequestId(firstGrant ?? null)).toBeUndefined();
    expect(await repository.findGrantedRequestId(secondGrant ?? null)).toBeUndefined();
    expect(await repository.issueDownloadGrant(view)).toBeUndefined();
  });

  it('issues no grant if the grant window vanished between writes', async () => {
    const { store, repository, view } = await approveRequest();
    const vanishingStore = {
      ...store,
      writeJson: () => Promise.resolve(false),
      readJson: () => Promise.resolve(undefined),
    };
    const vanishingRepository = createResumeRequestRepository(vanishingStore, 'local');

    expect(await vanishingRepository.issueDownloadGrant(view)).toBeUndefined();
    expect(await repository.issueDownloadGrant(view)).toMatch(/^[\w-]{43}$/);
  });

  it('rejects missing, malformed and unknown grants', async () => {
    const { repository } = createTestRepository();

    expect(await repository.findGrantedRequestId(null)).toBeUndefined();
    expect(await repository.findGrantedRequestId('short')).toBeUndefined();
    expect(await repository.findGrantedRequestId('x'.repeat(43))).toBeUndefined();
  });

  it('uses the real clock by default', async () => {
    const repository = createResumeRequestRepository(createMemoryKeyValueStore(), 'local');
    const { record } = await repository.create(requesterDetails, resumeRequestPendingWindowMs);

    expect(Math.abs(record.createdAtMs - Date.now())).toBeLessThan(5_000);
  });
});
