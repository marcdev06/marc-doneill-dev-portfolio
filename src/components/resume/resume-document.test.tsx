import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { education } from '@/content/education';
import { experience } from '@/content/experience';
import { home } from '@/content/home';
import { profile } from '@/content/profile';
import { skills } from '@/content/skills';
import { composeResume } from '@/lib/content';
import { ResumeDocument } from './resume-document';

const resume = composeResume({ profile, experience, skills, education, sectionCopy: home });

function renderResume(siteUrl: URL | undefined) {
  render(
    <ResumeDocument
      resume={resume}
      contentHash="abc123"
      siteUrl={siteUrl}
      pdfPath="/resume.pdf"
      downloadLabel="Download resume"
    />,
  );
  return screen.getByRole('article', { name: 'Marc Doneill Balatayo' });
}

describe('ResumeDocument', () => {
  it('renders a light-themed sheet tagged with its content hash', () => {
    const sheet = renderResume(undefined);

    expect(sheet).toHaveAttribute('data-bs-theme', 'light');
    expect(sheet).toHaveAttribute('data-content-hash', 'abc123');
    expect(within(sheet).getByText('Full-Stack Software Engineer')).toBeVisible();
  });

  it('lists the contact details without the site URL when none is configured', () => {
    const sheet = renderResume(undefined);

    expect(sheet).toHaveTextContent('Taguig City, PH');
    expect(
      within(sheet)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      'balatayo.marcdoneill@gmail.com',
      'linkedin.com/in/marcdev06',
      'github.com/marcdev06',
    ]);
  });

  it('adds the site URL when one is configured', () => {
    const sheet = renderResume(new URL('https://portfolio.example.com'));

    expect(within(sheet).getByRole('link', { name: 'portfolio.example.com' })).toHaveAttribute(
      'href',
      'https://portfolio.example.com/',
    );
  });

  it('includes experience, skills by tier and education', () => {
    const sheet = renderResume(undefined);

    expect(
      within(sheet)
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(['Experience', 'Skills', 'Education']);
    expect(sheet).toHaveTextContent('Software Engineer InternMar 2022 – Jun 2022');
    expect(sheet).toHaveTextContent('CoreLanguages: TypeScript, JavaScript, Java');
    expect(sheet).toHaveTextContent('Past experience');
    expect(sheet).toHaveTextContent(
      'University of Science and Technology of Southern Philippines · Cagayan de Oro City',
    );
    expect(sheet).toHaveTextContent('2018 – 2022');
  });

  it('offers the PDF download outside the printed sheet', () => {
    const sheet = renderResume(undefined);

    const downloadLink = screen.getByRole('link', { name: 'Download resume' });
    expect(downloadLink).toHaveAttribute('href', '/resume.pdf');
    expect(sheet).not.toContainElement(downloadLink);
  });
});
