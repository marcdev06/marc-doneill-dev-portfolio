import type { ContentLink } from '@/lib/content';

interface SiteFooterProps {
  ownerName: string;
  copyrightYear: number;
  repository: ContentLink;
}

export function SiteFooter({ ownerName, copyrightYear, repository }: SiteFooterProps) {
  return (
    <footer className="border-top py-4 d-print-none">
      <div className="container d-flex flex-column flex-sm-row align-items-start justify-content-between column-gap-4 small text-body-secondary">
        <p className="pf-link-target mb-0">
          © {copyrightYear} {ownerName}
        </p>
        <a className="pf-link-target" href={repository.href}>
          {repository.label}
        </a>
      </div>
    </footer>
  );
}
