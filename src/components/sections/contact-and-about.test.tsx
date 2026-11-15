import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { home } from '@/content/home';
import { profile } from '@/content/profile';
import { AboutSection } from './about-section';
import { ContactSection } from './contact-section';

describe('ContactSection', () => {
  it('offers email, profiles and the resume download, with no form yet', () => {
    const { container } = render(<ContactSection contact={home.contact} profile={profile} />);

    const section = screen.getByRole('region', { name: "Let's build something" });
    expect(section).toHaveAttribute('id', 'contact');
    expect(
      within(section).getByText('Open to freelance, contract, part-time and flexible work.'),
    ).toBeVisible();
    expect(
      within(section).getByRole('link', { name: 'balatayo.marcdoneill@gmail.com' }),
    ).toHaveAttribute('href', 'mailto:balatayo.marcdoneill@gmail.com');
    expect(within(section).getByRole('link', { name: 'GitHub profile' })).toBeVisible();
    expect(within(section).getByRole('link', { name: 'LinkedIn profile' })).toBeVisible();

    const resumeLink = within(section).getByRole('link', { name: 'Download resume' });
    expect(resumeLink).toHaveAttribute('href', '/resume.pdf');
    expect(resumeLink).toHaveAttribute('download');
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
