'use client';

import Link from 'next/link';
import { type KeyboardEvent, useId, useState } from 'react';
import Offcanvas from 'react-bootstrap/Offcanvas';
import type { NavigationLink } from '@/lib/content';
import { CloseIcon, ListIcon } from './ui/icons';

interface MobileNavigationProps {
  navigationLinks: readonly NavigationLink[];
}

// Wrap Tab inside the menu instead of leaving the page
function wrapTabFocus(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== 'Tab') {
    return;
  }
  const focusableElements = [
    ...event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
  ];
  const firstElement = focusableElements.at(0);
  const lastElement = focusableElements.at(-1);
  const focusedElement = document.activeElement;
  if (
    event.shiftKey &&
    (focusedElement === firstElement || focusedElement === event.currentTarget)
  ) {
    event.preventDefault();
    lastElement?.focus();
  } else if (!event.shiftKey && focusedElement === lastElement) {
    event.preventDefault();
    firstElement?.focus();
  }
}

export function MobileNavigation({ navigationLinks }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-icon rounded-circle d-lg-none"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <ListIcon className="fs-5" />
      </button>
      <Offcanvas
        show={isOpen}
        onHide={closeMenu}
        onKeyDown={wrapTabFocus}
        placement="end"
        aria-labelledby={titleId}
      >
        <Offcanvas.Header>
          <Offcanvas.Title as="h2" className="h5 mb-0" id={titleId}>
            Menu
          </Offcanvas.Title>
          <button
            type="button"
            className="btn btn-icon rounded-circle ms-auto"
            aria-label="Close menu"
            onClick={closeMenu}
          >
            <CloseIcon />
          </button>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <nav aria-label="Primary">
            <ul className="nav flex-column">
              {navigationLinks.map((navigationLink) => (
                <li className="nav-item" key={navigationLink.href}>
                  <Link className="nav-link fs-5" href={navigationLink.href} onClick={closeMenu}>
                    {navigationLink.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}
