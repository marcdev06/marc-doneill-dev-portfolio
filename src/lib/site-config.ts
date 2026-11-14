export interface NavigationLink {
  label: string;
  href: string;
}

// Placeholders: M1 moves these into src/content
export const siteName = 'Portfolio';
export const siteDescription = 'Placeholder description for the portfolio shell.';

export const mainContentId = 'main-content';

export const primaryNavigationLinks: readonly NavigationLink[] = [
  { label: 'Projects', href: '/#projects' },
  { label: 'Experience', href: '/#experience' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
];
