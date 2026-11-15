import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { home } from '@/content/home';
import { ResumeRequestTrigger } from './resume-request-trigger';

const { renderedDialogs } = vi.hoisted(() => ({ renderedDialogs: [] as boolean[] }));

vi.mock('./resume-request-dialog', () => ({
  default: function FakeResumeRequestDialog({
    isOpen,
    onClose,
    resumeFileName,
  }: {
    isOpen: boolean;
    onClose: () => void;
    resumeFileName: string;
  }) {
    renderedDialogs.push(isOpen);
    return (
      <div role="dialog" aria-label="Fake dialog" data-open={String(isOpen)}>
        {resumeFileName}
        <button type="button" onClick={onClose}>
          Close fake
        </button>
      </div>
    );
  },
}));

const copy = home.contact.resumeRequest;

describe('ResumeRequestTrigger', () => {
  it('is a plain link to the contact section before hydration and without JS', () => {
    const serverHtml = renderToString(
      <ResumeRequestTrigger copy={copy} resumeFileName="Marc_Doneill_Balatayo_CV.pdf" />,
    );

    expect(serverHtml).toMatch(/^<a [^>]*href="\/#contact"/);
    expect(serverHtml).toMatch(/^<a [^>]*class="btn btn-primary btn-glow"/);
    expect(serverHtml).toContain('Request my resume');
    expect(serverHtml).not.toContain('<button');
  });

  it('loads the dialog only when asked, and returns focus when it closes', async () => {
    const user = userEvent.setup();
    render(<ResumeRequestTrigger copy={copy} resumeFileName="Marc_Doneill_Balatayo_CV.pdf" />);

    const trigger = screen.getByRole('button', { name: 'Request my resume' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.hover(trigger);
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: 'Fake dialog' });
    expect(dialog).toHaveAttribute('data-open', 'true');
    expect(dialog).toHaveTextContent('Marc_Doneill_Balatayo_CV.pdf');

    await user.click(screen.getByRole('button', { name: 'Close fake' }));
    expect(dialog).toHaveAttribute('data-open', 'false');
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    expect(dialog).toHaveAttribute('data-open', 'true');
    expect(renderedDialogs).toContain(false);
  });

  it('warms the dialog chunk on keyboard focus', async () => {
    const user = userEvent.setup();
    render(<ResumeRequestTrigger copy={copy} resumeFileName="CV.pdf" />);

    await user.tab();

    expect(screen.getByRole('button', { name: 'Request my resume' })).toHaveFocus();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
