import Link from 'next/link';
import { primaryNavigationLinks, siteName } from '@/lib/site-config';

export function SiteHeader() {
  return (
    <header className="border-bottom">
      <nav className="navbar navbar-expand" aria-label="Primary">
        <div className="container flex-wrap">
          <Link className="navbar-brand fw-semibold" href="/">
            {siteName}
          </Link>
          <ul className="navbar-nav flex-wrap">
            {primaryNavigationLinks.map((navigationLink) => (
              <li className="nav-item" key={navigationLink.href}>
                <Link className="nav-link" href={navigationLink.href}>
                  {navigationLink.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
