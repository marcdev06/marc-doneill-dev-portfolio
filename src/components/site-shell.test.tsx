import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { profile } from '@/content/profile';
import { site } from '@/content/site';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { mainContentId, SkipLink } from './skip-link';

describe('site shell', () => {
  it('renders the wordmark, the primary navigation and the header controls', () => {
    render(
      <SiteHeader
        shortName={profile.shortName}
        monogram={profile.monogram}
        navigationLinks={site.navigationLinks}
      />,
    );

    const banner = screen.getByRole('banner');
    expect(within(banner).getByRole('link', { name: 'Marc Balatayo' })).toHaveAttribute(
      'href',
      '/',
    );

    const primaryNavigation = within(banner).getByRole('navigation', { name: 'Primary' });
    expect(within(primaryNavigation).getAllByRole('listitem')).toHaveLength(3);
    for (const navigationLink of site.navigationLinks) {
      expect(
        within(primaryNavigation).getByRole('link', { name: navigationLink.label }),
      ).toHaveAttribute('href', navigationLink.href);
    }
    expect(within(primaryNavigation).queryByRole('link', { name: 'Projects' })).toBeNull();

    expect(within(banner).getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
    expect(within(banner).getByRole('button', { name: 'Open menu' })).toBeVisible();
  });

  it('renders the copyright line and the source link', () => {
    render(
      <SiteFooter ownerName={profile.name} copyrightYear={2026} repository={site.repository} />,
    );

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent('© 2026 Marc Doneill Balatayo');
    expect(within(footer).getAllByRole('link')).toHaveLength(1);
    expect(
      within(footer).getByRole('link', { name: 'Built with Next.js + Bootstrap' }),
    ).toHaveAttribute('href', 'https://github.com/marcdev06/marc-doneill-dev-portfolio');
  });

  it('renders a skip link pointing at the main content', () => {
    render(<SkipLink targetId={mainContentId} />);

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    );
  });
});
