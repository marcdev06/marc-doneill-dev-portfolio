import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { home } from '@/content/home';
import { profile } from '@/content/profile';
import { HeroSection } from './hero-section';

describe('HeroSection', () => {
  it('renders the approved copy from top to bottom', () => {
    render(<HeroSection hero={home.hero} profile={profile} />);

    const hero = screen.getByRole('region', {
      name: 'Building software that makes life easier for every Filipino.',
    });
    expect(within(hero).getByText('Open to freelance & contract work')).toBeVisible();
    expect(within(hero).getByText("Hi, I'm Marc Doneill Balatayo")).toBeVisible();
    expect(within(hero).getByText('every Filipino')).toBeVisible();
    expect(
      within(hero).getByText("I'm a full-stack software engineer.", {
        selector: '.visually-hidden',
      }),
    ).toBeInTheDocument();
    expect(hero).toHaveTextContent(
      "Mid-Level Full-Stack Software Engineer at KwikCare, building its HMO platform. Before that: Singlife's Policy Admin System.",
    );
    expect(within(hero).getByRole('link', { name: 'KwikCare' })).toHaveAttribute(
      'href',
      'https://kwik.care/kwikcare',
    );
    expect(
      within(hero).getByText(
        '4+ years building web apps end to end: React and Next.js front ends, Spring Boot and GraphQL APIs, and the PostgreSQL databases behind them.',
      ),
    ).toBeVisible();
  });

  it('keeps the circled highlight as plain text inside the heading', () => {
    render(<HeroSection hero={home.hero} profile={profile} />);

    const highlight = screen.getByText('every Filipino');
    expect(highlight.tagName).toBe('SPAN');
    expect(highlight.childElementCount).toBe(0);
    expect(highlight.closest('h1')).toHaveAccessibleName(
      'Building software that makes life easier for every Filipino.',
    );
  });

  it('links the calls to action to the contact and experience sections', () => {
    render(<HeroSection hero={home.hero} profile={profile} />);

    expect(screen.getByRole('link', { name: 'Work with me' })).toHaveAttribute('href', '#contact');
    expect(screen.getByRole('link', { name: 'See experience' })).toHaveAttribute(
      'href',
      '#experience',
    );
  });

  it('shows the photo, location, time zone and social links', () => {
    render(<HeroSection hero={home.hero} profile={profile} />);

    expect(screen.getByRole('img', { name: 'Portrait of Marc Doneill Balatayo' })).toBeVisible();
    expect(screen.getByText('Taguig City, PH')).toBeVisible();
    expect(screen.getByText('Manila time (UTC+8)')).toBeVisible();
    expect(screen.getByRole('link', { name: 'GitHub profile' })).toHaveAttribute(
      'href',
      'https://github.com/marcdev06',
    );
    expect(screen.getByRole('link', { name: 'LinkedIn profile' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/marcdev06',
    );
  });
});
