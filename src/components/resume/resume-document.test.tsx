import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { education } from '@/content/education';
import { experience } from '@/content/experience';
import { home } from '@/content/home';
import { profile } from '@/content/profile';
import { site } from '@/content/site';
import { skills } from '@/content/skills';
import { composeResume } from '@/lib/content';
import { ResumeDocument } from './resume-document';

vi.mock('./resume-fonts', () => ({
  resumeMediumFont: { variable: 'font-medium' },
  resumeItalicFont: { variable: 'font-italic' },
}));

const resume = composeResume({
  profile,
  about: site.description,
  experience,
  skills,
  education,
  sectionCopy: home,
  resumeCopy: site.resumePage,
});

function renderResume({ siteUrl, contactEmail }: { siteUrl?: URL; contactEmail?: string } = {}) {
  render(
    <ResumeDocument
      resume={resume}
      contentHash="abc123"
      fileName="Marc_Doneill_Balatayo_CV.pdf"
      photo={profile.photo}
      siteUrl={siteUrl}
      contactEmail={contactEmail}
    />,
  );
  return screen.getByRole('article', { name: 'Marc Doneill Balatayo' });
}

function readContactLines(sheet: HTMLElement) {
  const contactSection = within(sheet).getByRole('region', { name: 'Contact' });
  return within(contactSection)
    .getAllByRole('listitem')
    .map((contactItem) => contactItem.textContent);
}

describe('ResumeDocument', () => {
  it('renders a light sheet tagged with its content hash and file name', () => {
    const sheet = renderResume();

    expect(sheet).toHaveAttribute('data-bs-theme', 'light');
    expect(sheet).toHaveAttribute('data-content-hash', 'abc123');
    expect(sheet).toHaveAttribute('data-file-name', 'Marc_Doneill_Balatayo_CV.pdf');
    expect(sheet).toHaveClass('font-medium', 'font-italic');
    expect(within(sheet).getByText('Full-Stack Software Engineer')).toBeVisible();
  });

  it('keeps an ATS-friendly order: name, title, contact, about, experience, education, skills', () => {
    const sheet = renderResume();

    expect(
      within(sheet)
        .getAllByRole('heading', { level: 1 })
        .concat(within(sheet).getAllByRole('heading', { level: 2 }))
        .map((heading) => heading.textContent),
    ).toEqual([
      'Marc Doneill Balatayo',
      'Contact',
      'About me',
      'Experience',
      'Education',
      'Technical Skills',
    ]);
    const title = within(sheet).getByText('Full-Stack Software Engineer');
    const contactHeading = within(sheet).getByRole('heading', { name: 'Contact' });
    expect(title.compareDocumentPosition(contactHeading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('lists the email, links and location in that order when the email is set', () => {
    const sheet = renderResume({
      siteUrl: new URL('https://portfolio.example.com'),
      contactEmail: 'ada@example.com',
    });

    expect(readContactLines(sheet)).toEqual([
      'ada@example.com',
      'linkedin.com/in/marcdev06',
      'github.com/marcdev06',
      'portfolio.example.com',
      'Taguig City, PH',
    ]);
    expect(within(sheet).getByRole('link', { name: 'portfolio.example.com' })).toHaveAttribute(
      'href',
      'https://portfolio.example.com/',
    );
    expect(sheet.querySelector('wbr')?.previousSibling?.textContent).toBe('ada@');
    expect(sheet.querySelector('a[href^="mailto"]')).toBeNull();
  });

  it('leaves out the email and site lines when they are not configured', () => {
    const sheet = renderResume();

    expect(readContactLines(sheet)).toEqual([
      'linkedin.com/in/marcdev06',
      'github.com/marcdev06',
      'Taguig City, PH',
    ]);
    expect(sheet).not.toHaveTextContent('@');
  });

  it('shows the photo, about text and experience with the new subheadings', () => {
    const sheet = renderResume();

    expect(within(sheet).getByRole('img', { name: profile.photo.alt })).toHaveAttribute(
      'src',
      '/images/profile-photo.jpg',
    );
    expect(sheet).toHaveTextContent(site.description);
    expect(
      within(sheet)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual([
      'Mid-Level Full-Stack Software Engineer',
      'Software Engineer',
      'Software Engineer',
      'Software Engineer Intern',
      'Bachelor of Science in Information Technology',
    ]);
    expect(sheet).toHaveTextContent(
      'KwikCare · A digital insurance brokerage and subscription-based HMO (Health Maintenance Organization) provider in the Philippines',
    );
    expect(sheet).toHaveTextContent(
      'Singlife Philippines · A mobile-first, digital life insurance and financial services company in the Philippines',
    );
    expect(sheet).toHaveTextContent('Software Engineer InternMar 2022 – Jun 2022');
    expect(sheet).toHaveTextContent('Cagayan de Oro City · 2018 – 2022');
  });

  it('lists skills per tier as comma lists', () => {
    const sheet = renderResume();

    const skillsSection = within(sheet).getByRole('region', { name: 'Technical Skills' });
    expect(
      within(skillsSection)
        .getAllByRole('term')
        .map((term) => term.textContent),
    ).toEqual(['Core', 'Comfortable', 'Past experience']);
    expect(within(skillsSection).getAllByRole('definition')[0]).toHaveTextContent(
      /^TypeScript, JavaScript, Java, React, .*, MySQL$/,
    );
  });

  it('draws the skills orbit as a text-free, hidden backdrop', () => {
    const sheet = renderResume();

    const orbit = within(sheet).getByTestId('skill-orbit');
    expect(orbit.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(orbit).toHaveTextContent(/^$/);
    expect(orbit.querySelector('[title]')).toBeNull();
    expect(orbit.querySelector('title')).toBeNull();
    expect(orbit.querySelectorAll('use').length).toBeGreaterThan(0);
  });
});
