import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { Poppins } from 'next/font/google';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { mainContentId, SkipLink } from '@/components/skip-link';
import { VercelAnalytics } from '@/components/vercel-analytics';
import { profile } from '@/content/profile';
import { site } from '@/content/site';
import { buildOpenGraph } from '@/lib/seo';
import { getSiteUrl } from '@/lib/site-url';
import '@/styles/main.scss';

const poppins = Poppins({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: site.homeTitle,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  authors: [{ name: profile.name, url: getSiteUrl().href }],
  openGraph: buildOpenGraph(site, {
    path: '/',
    title: site.homeTitle,
    description: site.description,
  }),
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#0f1714',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={poppins.variable} data-bs-theme="dark" suppressHydrationWarning>
      <body className="d-flex flex-column min-vh-100">
        <ThemeProvider
          attribute="data-bs-theme"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SkipLink targetId={mainContentId} />
          <SiteHeader
            shortName={profile.shortName}
            monogram={profile.monogram}
            navigationLinks={site.navigationLinks}
          />
          <main id={mainContentId} className="flex-grow-1" tabIndex={-1}>
            {children}
          </main>
          <SiteFooter
            ownerName={profile.name}
            copyrightYear={new Date().getFullYear()}
            repository={site.repository}
          />
        </ThemeProvider>
        <VercelAnalytics />
      </body>
    </html>
  );
}
