import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { site } from '@/content/site';
import { MobileNavigation } from './mobile-navigation';

async function openMenu() {
  const user = userEvent.setup();
  render(<MobileNavigation navigationLinks={site.navigationLinks} />);
  const menuButton = screen.getByRole('button', { name: 'Open menu' });
  expect(menuButton).toHaveAttribute('aria-expanded', 'false');

  await user.click(menuButton);

  const menuDialog = await screen.findByRole('dialog', { name: 'Menu' });
  return { user, menuButton, menuDialog };
}

describe('MobileNavigation', () => {
  it('opens a labelled dialog with the primary links', async () => {
    const { menuButton, menuDialog } = await openMenu();

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    const navigation = within(menuDialog).getByRole('navigation', { name: 'Primary' });
    expect(
      within(navigation)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/#experience', '/#about', '/#contact']);
  });

  it('wraps Tab and Shift+Tab inside the menu', async () => {
    const { user, menuDialog } = await openMenu();
    const closeButton = within(menuDialog).getByRole('button', { name: 'Close menu' });
    const contactLink = within(menuDialog).getByRole('link', { name: 'Contact' });

    await user.tab({ shift: true });
    expect(contactLink).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(contactLink).toHaveFocus();

    await user.tab({ shift: true });
    expect(within(menuDialog).getByRole('link', { name: 'About' })).toHaveFocus();
  });

  it('closes from the labelled close button', async () => {
    const { user, menuDialog } = await openMenu();

    await user.click(within(menuDialog).getByRole('button', { name: 'Close menu' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('closes with the Escape key', async () => {
    const { user } = await openMenu();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('closes after a link is chosen', async () => {
    const { user, menuDialog } = await openMenu();

    await user.click(within(menuDialog).getByRole('link', { name: 'About' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
