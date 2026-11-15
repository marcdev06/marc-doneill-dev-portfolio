import Link from 'next/link';
import type { NavigationLink } from '@/lib/content';
import { MobileNavigation } from './mobile-navigation';
import styles from './site-header.module.scss';
import { ThemeToggle } from './theme-toggle';
import { joinClassNames } from './ui/join-class-names';

interface SiteHeaderProps {
  shortName: string;
  monogram: string;
  navigationLinks: readonly NavigationLink[];
}

export function SiteHeader({ shortName, monogram, navigationLinks }: SiteHeaderProps) {
  return (
    <header className={joinClassNames(styles.header, 'd-print-none')}>
      <div className="container h-100 d-flex align-items-center gap-2">
        <Link className={joinClassNames(styles.brand, 'me-auto')} href="/">
          <span className={styles.monogram} aria-hidden="true">
            {monogram}
          </span>
          <span>{shortName}</span>
        </Link>
        <nav className="d-none d-lg-block" aria-label="Primary">
          <ul className="nav">
            {navigationLinks.map((navigationLink) => (
              <li className="nav-item" key={navigationLink.href}>
                <Link className="nav-link" href={navigationLink.href}>
                  {navigationLink.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <ThemeToggle />
        <MobileNavigation navigationLinks={navigationLinks} />
      </div>
    </header>
  );
}
