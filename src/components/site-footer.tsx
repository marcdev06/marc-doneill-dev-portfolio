import { siteName } from '@/lib/site-config';

export function SiteFooter() {
  return (
    <footer className="border-top py-4">
      <div className="container">
        <p className="mb-0 small text-body-secondary">
          {siteName} · Built with Next.js and Bootstrap.
        </p>
      </div>
    </footer>
  );
}
