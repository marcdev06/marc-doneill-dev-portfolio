import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { home } from '@/content/home';
import ResumeRequestDialog from './resume-request-dialog';
import type { ResumeRequestFormState } from './resume-request-form-state';

const { requestResume, loadBotProtection } = vi.hoisted(() => ({
  requestResume: vi.fn(),
  loadBotProtection: vi.fn(),
}));

vi.mock('./request-resume', () => ({ requestResume }));
vi.mock('@/features/bot-protection/load-bot-protection', () => ({ loadBotProtection }));
vi.mock('@/lib/resume-request/resume-request-timing', () => ({
  statusPollIntervalMs: 5,
  clientPollingLimitMs: 60_000,
}));

const copy = home.contact.resumeRequest;
const pendingRequest = { requestId: 'r'.repeat(22), requesterToken: 't'.repeat(43) };
const typedValues = { name: 'Jane Doe', email: 'jane@example.com' };

function resolveWith(formState: Partial<ResumeRequestFormState>) {
  requestResume.mockResolvedValue({
    status: 'waiting',
    invalidFields: [],
    values: { name: '', email: '', note: '' },
    submissionCount: 1,
    ...formState,
  });
}

function respondWithStatuses(...statusBodies: (object | number)[]) {
  const fetchMock = vi.fn();
  for (const statusBody of statusBodies) {
    fetchMock.mockResolvedValueOnce(
      typeof statusBody === 'number'
        ? new Response(null, { status: statusBody })
        : Response.json(statusBody),
    );
  }
  fetchMock.mockResolvedValue(Response.json({ status: 'pending' }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderDialog(onClose = vi.fn()) {
  render(
    <ResumeRequestDialog
      copy={copy}
      resumeFileName="Marc_Doneill_Balatayo_CV.pdf"
      isOpen
      onClose={onClose}
    />,
  );
  return { dialog: screen.getByRole('dialog', { name: 'Request my resume' }), onClose };
}

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Name'), typedValues.name);
  await user.type(screen.getByLabelText('Email'), typedValues.email);
  await user.click(screen.getByRole('button', { name: 'Send request' }));
  return user;
}

describe('ResumeRequestDialog', () => {
  let anchorClick: MockInstance<HTMLAnchorElement['click']>;

  beforeEach(() => {
    requestResume.mockReset();
    loadBotProtection.mockReset();
    anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('opens as a labelled modal with natively validated fields and starts BotID', () => {
    const { dialog } = renderDialog();

    expect(dialog).toHaveProperty('open', true);
    expect(dialog).toHaveAccessibleDescription(copy.intro);
    expect(loadBotProtection).toHaveBeenCalledTimes(1);

    const nameField = screen.getByLabelText('Name');
    expect(nameField).toHaveFocus();
    expect(nameField).toBeRequired();
    expect(nameField).toHaveAttribute('minlength', '2');
    expect(nameField).toHaveAttribute('maxlength', '100');
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Email')).toHaveAttribute('maxlength', '254');
    const noteField = screen.getByLabelText("What's it for? (optional)");
    expect(noteField).not.toBeRequired();
    expect(noteField).toHaveAttribute('maxlength', '500');
    expect(screen.getByRole('button', { name: 'Send request' })).toHaveAccessibleDescription(
      copy.privacyNote,
    );
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(
      dialog.querySelector('input[name="company_website"]')?.closest('[aria-hidden]'),
    ).not.toBeNull();
  });

  it('shows the pending label while sending, keeping focus on the button', async () => {
    let finishSending: (formState: ResumeRequestFormState) => void = () => undefined;
    requestResume.mockReturnValue(
      new Promise<ResumeRequestFormState>((resolve) => {
        finishSending = resolve;
      }),
    );
    respondWithStatuses();
    renderDialog();

    const user = await fillAndSubmit();

    const pendingButton = screen.getByRole('button', { name: 'Sending…' });
    expect(pendingButton).toHaveAttribute('aria-disabled', 'true');
    expect(pendingButton).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(requestResume).toHaveBeenCalledTimes(1);
    await act(async () => {
      finishSending({
        status: 'invalid',
        invalidFields: ['email'],
        values: { ...typedValues, note: '' },
        submissionCount: 1,
      });
      await Promise.resolve();
    });
    expect(screen.getByRole('button', { name: 'Send request' })).not.toHaveAttribute(
      'aria-disabled',
    );
  });

  it('marks invalid fields and focuses the first one', async () => {
    resolveWith({
      status: 'invalid',
      invalidFields: ['email', 'note'],
      values: { name: 'Jane Doe', email: 'jane@example', note: 'n'.repeat(500) },
    });
    renderDialog();

    await fillAndSubmit();

    const emailField = screen.getByLabelText('Email');
    await waitFor(() => {
      expect(emailField).toHaveFocus();
    });
    expect(emailField).toHaveAttribute('aria-invalid', 'true');
    expect(emailField).toHaveAccessibleDescription(copy.fields.email.error);
    expect(screen.getByLabelText("What's it for? (optional)")).toHaveAccessibleDescription(
      copy.fields.note.error,
    );
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-invalid');
  });

  it('keeps the form after a failure so the visitor can retry later', async () => {
    resolveWith({ status: 'failed', values: { ...typedValues, note: '' } });
    renderDialog();

    await fillAndSubmit();

    expect(await within(screen.getByRole('status')).findByText(copy.failureMessage)).toBeVisible();
    expect(screen.getByLabelText('Name')).toHaveValue('Jane Doe');
  });

  it('hides the form and moves focus to Close when rate-limited', async () => {
    resolveWith({ status: 'rate-limited', values: { ...typedValues, note: '' } });
    renderDialog();

    await fillAndSubmit();

    expect(await screen.findByText(copy.rateLimitedMessage)).toBeVisible();
    expect(screen.queryByLabelText('Name')).toBeNull();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('waits, polls with the requester token, then downloads on approval', async () => {
    resolveWith({ pendingRequest });
    const fetchMock = respondWithStatuses({ status: 'pending' }, 503, {
      status: 'approved',
      grant: 'g'.repeat(43),
    });
    renderDialog();

    await fillAndSubmit();

    const statusRegion = screen.getByRole('status');
    expect(await within(statusRegion).findByText(copy.waitingMessage)).toBeVisible();
    expect(screen.queryByLabelText('Name')).toBeNull();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();

    const downloadLink = await within(statusRegion).findByRole('link', {
      name: 'Download the PDF',
    });
    expect(statusRegion).toHaveTextContent(copy.approvedMessage);
    expect(downloadLink).toHaveAttribute('href', `/api/resume/download?grant=${'g'.repeat(43)}`);
    expect(downloadLink).toHaveAttribute('download', 'Marc_Doneill_Balatayo_CV.pdf');
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/resume-requests/${pendingRequest.requestId}/status`,
      {
        headers: { 'x-resume-request-token': pendingRequest.requesterToken },
        cache: 'no-store',
      },
    );
  });

  it.each([
    [{ status: 'denied' }, copy.deniedMessage],
    [{ status: 'expired' }, copy.expiredMessage],
    [404, copy.failureMessage],
  ])('settles on %j', async (statusBody, expectedMessage) => {
    resolveWith({ pendingRequest });
    respondWithStatuses(statusBody);
    renderDialog();

    await fillAndSubmit();

    expect(await within(screen.getByRole('status')).findByText(expectedMessage)).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Download the PDF' })).toBeNull();
  });

  it('closes with the Close button and tells the trigger', async () => {
    const user = userEvent.setup();
    const { dialog, onClose } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(dialog).toHaveProperty('open', false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('follows isOpen when the trigger reopens it', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <ResumeRequestDialog copy={copy} resumeFileName="CV.pdf" isOpen={false} onClose={onClose} />,
    );
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveProperty('open', false);

    rerender(<ResumeRequestDialog copy={copy} resumeFileName="CV.pdf" isOpen onClose={onClose} />);
    expect(dialog).toHaveProperty('open', true);

    rerender(
      <ResumeRequestDialog copy={copy} resumeFileName="CV.pdf" isOpen={false} onClose={onClose} />,
    );
    expect(dialog).toHaveProperty('open', false);
  });
});
