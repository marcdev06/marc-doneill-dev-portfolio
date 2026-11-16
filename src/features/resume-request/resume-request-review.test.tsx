import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { site } from '@/content/site';
import { resolveRequestServices } from '@/features/request-store/request-services';
import type { ResumeRequestView } from '@/lib/resume-request/resume-request-repository';
import { useMemoryRequestStore, useUnconfiguredRequestStore } from '../../../test/request-services';
import { decideResumeRequest } from './decide-resume-request';
import { loadResumeRequestReview } from './load-resume-request-review';
import { ResumeRequestReview } from './resume-request-review';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirect: vi.fn((location: string) => {
    throw new Error(`NEXT_REDIRECT ${location}`);
  }),
}));

async function createRequest(pendingWindowMs = 60_000) {
  const servicesResult = await resolveRequestServices();
  if (!servicesResult.isAvailable) {
    throw new Error(servicesResult.problem);
  }
  return servicesResult.services.repository.create(
    { name: 'Jane Doe', email: 'jane@example.com', note: 'Line one\nLine two' },
    pendingWindowMs,
  );
}

function buildDecisionForm(requestId: string, approvalToken: string, decision: string) {
  const formData = new FormData();
  formData.set('requestId', requestId);
  formData.set('token', approvalToken);
  formData.set('decision', decision);
  return formData;
}

function requireView(view: ResumeRequestView | undefined): ResumeRequestView {
  if (!view) {
    throw new Error('Expected a readable request');
  }
  return view;
}

function requireForm(formElement: HTMLFormElement | null): HTMLFormElement {
  if (!formElement) {
    throw new Error('Expected the button inside a form');
  }
  return formElement;
}

function renderReview(view: ResumeRequestView, approvalToken = 'approval-token') {
  render(
    <ResumeRequestReview view={view} approvalToken={approvalToken} copy={site.resumeReview} />,
  );
}

describe('resume request review', () => {
  beforeEach(() => {
    useMemoryRequestStore();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('loads a request only with its approval token', async () => {
    const { record, requesterToken, approvalToken } = await createRequest();

    expect(await loadResumeRequestReview(record.id, approvalToken)).toMatchObject({
      status: 'pending',
      record: { email: 'jane@example.com' },
    });
    expect(await loadResumeRequestReview(record.id, requesterToken)).toBeUndefined();
    expect(await loadResumeRequestReview(record.id, undefined)).toBeUndefined();
  });

  it('loads nothing, with a server log, when Redis is not configured', async () => {
    useUnconfiguredRequestStore();

    expect(await loadResumeRequestReview('x'.repeat(22), 'y'.repeat(43))).toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it('shows the details and POST buttons while pending', async () => {
    const { record, approvalToken } = await createRequest();
    const view = await loadResumeRequestReview(record.id, approvalToken);
    renderReview(requireView(view), approvalToken);

    expect(screen.getByRole('heading', { level: 1, name: 'Resume request' })).toBeVisible();
    const terms = screen.getAllByRole('term').map((term) => term.textContent);
    const definitions = screen
      .getAllByRole('definition')
      .map((definition) => definition.textContent);
    expect(
      Object.fromEntries(terms.map((term, termIndex) => [term, definitions[termIndex]])),
    ).toMatchObject({
      Name: 'Jane Doe',
      Email: 'jane@example.com',
      Note: 'Line one\nLine two',
      Country: 'Not given',
      Status: 'Waiting for your decision',
    });
    expect(screen.getAllByText(/\(Manila time\)$/)).toHaveLength(2);

    const approveButton = screen.getByRole('button', { name: 'Approve' });
    const approveForm = approveButton.closest('form');
    expect(approveForm).not.toBeNull();
    expect(Object.fromEntries(new FormData(requireForm(approveForm)).entries())).toEqual({
      requestId: record.id,
      token: approvalToken,
      decision: 'approved',
    });
    expect(screen.getByRole('button', { name: 'Deny' })).toBeVisible();
    expect(document.querySelector('a[href^="mailto"]')).toBeNull();
  });

  it('shows a decided request without buttons', async () => {
    const { record, approvalToken } = await createRequest();
    await expect(
      decideResumeRequest(buildDecisionForm(record.id, approvalToken, 'denied')),
    ).rejects.toThrow(`NEXT_REDIRECT /resume-requests/${record.id}?token=${approvalToken}`);

    const view = await loadResumeRequestReview(record.id, approvalToken);
    renderReview(requireView(view));

    expect(screen.getByText('Denied. They see a polite message.')).toBeVisible();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('asks Marc to reply by email once the window has passed', async () => {
    const { record, approvalToken } = await createRequest(-1);
    const view = await loadResumeRequestReview(record.id, approvalToken);
    renderReview(requireView(view));

    expect(
      screen.getByText('This request expired before you decided. Reply by email instead:'),
    ).toHaveTextContent(/jane@example\.com$/);
    expect(screen.queryByRole('button')).toBeNull();
  });

  describe('decideResumeRequest', () => {
    it('records one decision, then reloads the review page', async () => {
      const { record, approvalToken, requesterToken } = await createRequest();

      await expect(
        decideResumeRequest(buildDecisionForm(record.id, approvalToken, 'approved')),
      ).rejects.toThrow('NEXT_REDIRECT');
      await expect(
        decideResumeRequest(buildDecisionForm(record.id, approvalToken, 'denied')),
      ).rejects.toThrow('NEXT_REDIRECT');

      const servicesResult = await resolveRequestServices();
      const view =
        servicesResult.isAvailable &&
        (await servicesResult.services.repository.findForRequester(record.id, requesterToken));
      expect(view).toMatchObject({ status: 'approved' });
    });

    it('answers 404 to a bad token, an unknown decision or a missing store', async () => {
      const { record, approvalToken, requesterToken } = await createRequest();

      await expect(
        decideResumeRequest(buildDecisionForm(record.id, requesterToken, 'approved')),
      ).rejects.toThrow('NEXT_NOT_FOUND');
      await expect(
        decideResumeRequest(buildDecisionForm(record.id, approvalToken, 'maybe')),
      ).rejects.toThrow('NEXT_NOT_FOUND');
      await expect(decideResumeRequest(new FormData())).rejects.toThrow('NEXT_NOT_FOUND');

      useUnconfiguredRequestStore();
      await expect(
        decideResumeRequest(buildDecisionForm(record.id, approvalToken, 'approved')),
      ).rejects.toThrow('NEXT_NOT_FOUND');
    });
  });

  it('labels every status', () => {
    const baseView: ResumeRequestView = {
      status: 'approved',
      record: {
        id: 'x'.repeat(22),
        requesterTokenHash: 'requester-hash',
        approvalTokenHash: 'approval-hash',
        name: 'Jane Doe',
        email: 'jane@example.com',
        country: 'PH',
        createdAtMs: 0,
        decideByMs: 60_000,
      },
    };
    renderReview(baseView);

    const statusDefinition = within(document.body).getByText(
      'Approved. The download starts in their window.',
    );
    expect(statusDefinition.tagName).toBe('DD');
    expect(screen.getByText('PH')).toBeVisible();
  });
});
