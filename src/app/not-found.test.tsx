import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NotFoundPage, { metadata } from './not-found';

describe('NotFoundPage', () => {
  it('renders a heading and a link back home', () => {
    render(<NotFoundPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
  });

  it('sets the page title', () => {
    expect(metadata.title).toBe('Page not found');
  });
});
