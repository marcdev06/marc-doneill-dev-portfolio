import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ResumePage, { metadata } from './page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
vi.mock('@/components/resume/resume-fonts', () => ({
  resumeMediumFont: { variable: 'font-medium' },
  resumeItalicFont: { variable: 'font-italic' },
}));

describe('/resume', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is never served on Vercel', () => {
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('RESUME_CONTACT_EMAIL', 'ada@example.com');

    expect(() => ResumePage()).toThrow('NEXT_NOT_FOUND');
  });

  it('is titled for the PDF and kept out of search indexes', () => {
    expect(metadata.title).toEqual({ absolute: 'Marc Doneill Balatayo – CV' });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('shows the email only when the PDF script passes one in', () => {
    vi.stubEnv('VERCEL', '');
    vi.stubEnv('RESUME_CONTACT_EMAIL', 'ada@example.com');
    const { unmount } = render(<ResumePage />);

    const contactSection = screen.getByRole('region', { name: 'Contact' });
    expect(within(contactSection).getAllByRole('listitem')[0]).toHaveTextContent('ada@example.com');
    unmount();

    vi.stubEnv('RESUME_CONTACT_EMAIL', ' ');
    render(<ResumePage />);
    expect(screen.getByRole('region', { name: 'Contact' })).not.toHaveTextContent('@');
  });
});
