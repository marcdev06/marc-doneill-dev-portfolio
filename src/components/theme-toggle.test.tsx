import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'next-themes';
import { describe, expect, it } from 'vitest';
import { ThemeToggle } from './theme-toggle';

function renderToggle() {
  render(
    <ThemeProvider attribute="data-bs-theme" defaultTheme="dark" enableSystem={false}>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe('ThemeToggle', () => {
  it('starts dark and offers the light theme', () => {
    renderToggle();

    expect(document.documentElement).toHaveAttribute('data-bs-theme', 'dark');
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
  });

  it('switches themes and remembers the choice', async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }));

    expect(document.documentElement).toHaveAttribute('data-bs-theme', 'light');
    expect(window.localStorage.getItem('theme')).toBe('light');

    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));

    expect(document.documentElement).toHaveAttribute('data-bs-theme', 'dark');
    expect(window.localStorage.getItem('theme')).toBe('dark');
  });

  it('restores a saved light theme', () => {
    window.localStorage.setItem('theme', 'light');
    renderToggle();

    expect(document.documentElement).toHaveAttribute('data-bs-theme', 'light');
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible();
  });
});
