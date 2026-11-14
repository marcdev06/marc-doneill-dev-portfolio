import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SkipLink } from '@/components/skip-link';
import { mainContentId, siteDescription, siteName } from '@/lib/site-config';
import { getSiteUrl } from '@/lib/site-url';
import '@/styles/main.scss';

// Placeholder font: M1 switches to the design.md choice
const sansFont = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={sansFont.variable}>
      <body className="d-flex flex-column min-vh-100">
        <SkipLink targetId={mainContentId} />
        <SiteHeader />
        <main id={mainContentId} className="flex-grow-1" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
