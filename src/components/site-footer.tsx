import type { ContentLink } from '@/lib/content';

interface SiteFooterProps {
  ownerName: string;
  copyrightYear: number;
  designCredit: ContentLink;
  repository: ContentLink;
}

export function SiteFooter({
  ownerName,
  copyrightYear,
  designCredit,
  repository,
}: SiteFooterProps) {
  return (
    <footer className="border-top py-4 d-print-none">
      <div className="container d-flex flex-column flex-lg-row column-gap-4 justify-content-between small text-body-secondary">
        <p className="pf-link-target mb-0">
          © {copyrightYear} {ownerName}
        </p>
        <ul className="list-unstyled d-flex flex-column flex-md-row column-gap-4 mb-0">
          <li>
            <a className="pf-link-target" href={designCredit.href}>
              {designCredit.label}
            </a>
          </li>
          <li>
            <a className="pf-link-target" href={repository.href}>
              {repository.label}
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
