import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { primaryNavigationLinks, siteName } from '@/lib/site-config';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { SkipLink } from './skip-link';

describe('site shell', () => {
  it('renders the header with a home link and the primary navigation', () => {
    render(<SiteHeader />);

    const banner = screen.getByRole('banner');
    expect(within(banner).getByRole('link', { name: siteName })).toHaveAttribute('href', '/');

    const primaryNavigation = within(banner).getByRole('navigation', { name: 'Primary' });
    const renderedLinks = within(primaryNavigation).getAllByRole('listitem');
    expect(renderedLinks).toHaveLength(primaryNavigationLinks.length);

    for (const navigationLink of primaryNavigationLinks) {
      expect(
        within(primaryNavigation).getByRole('link', { name: navigationLink.label }),
      ).toHaveAttribute('href', navigationLink.href);
    }
  });

  it('renders the footer as the content info landmark', () => {
    render(<SiteFooter />);

    expect(screen.getByRole('contentinfo')).toHaveTextContent(siteName);
  });

  it('renders a skip link pointing at the target id', () => {
    render(<SkipLink targetId="main-content" />);

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    );
  });
});
