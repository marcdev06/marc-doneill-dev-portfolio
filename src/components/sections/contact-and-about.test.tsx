import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { home } from '@/content/home';
import { profile } from '@/content/profile';
import { AboutSection } from './about-section';
import { ContactSection } from './contact-section';

describe('ContactSection', () => {
  it('renders the form slot below the intro and the resume slot beside the profiles', () => {
    render(
      <ContactSection
        contact={home.contact}
        profile={profile}
        form={<form aria-label="Slot form" />}
        resumeRequest={<button type="button">Slot resume request</button>}
      />,
    );

    const section = screen.getByRole('region', { name: "Let's build something" });
    const slotForm = within(section).getByRole('form', { name: 'Slot form' });
    const intro = within(section).getByText(profile.availability.detail);
    const githubLink = within(section).getByRole('link', { name: 'GitHub profile' });
    const resumeButton = within(section).getByRole('button', { name: 'Slot resume request' });
    expect(intro.compareDocumentPosition(slotForm)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(slotForm.compareDocumentPosition(githubLink)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(githubLink.compareDocumentPosition(resumeButton)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('offers the profiles without slots, and no email address or mailto link', () => {
    const { container } = render(<ContactSection contact={home.contact} profile={profile} />);

    const section = screen.getByRole('region', { name: "Let's build something" });
    expect(section).toHaveAttribute('id', 'contact');
    expect(
      within(section).getByText('Open to freelance, contract, part-time and flexible work.'),
    ).toBeVisible();
    expect(within(section).getByRole('link', { name: 'GitHub profile' })).toHaveAttribute(
      'href',
      'https://github.com/marcdev06',
    );
    expect(within(section).getByRole('link', { name: 'LinkedIn profile' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/marcdev06',
    );
    expect(within(section).getAllByRole('link')).toHaveLength(2);
    expect(container.querySelector('a[href^="mailto"]')).toBeNull();
    expect(container.innerHTML).not.toContain('@');
    expect(container.querySelector('form')).toBeNull();
  });
});

describe('AboutSection', () => {
  it('renders the about paragraph and the how-I-work line', () => {
    render(<AboutSection about={home.about} />);

    const section = screen.getByRole('region', { name: 'About' });
    expect(section).toHaveAttribute('id', 'about');
    expect(section).toHaveTextContent("I'm a full-stack engineer based in Taguig City.");
    expect(within(section).getByRole('complementary', { name: 'How I work' })).toHaveTextContent(
      'I document what I build, test before I hand work off, and work as well on my own as in a team.',
    );
  });
});
