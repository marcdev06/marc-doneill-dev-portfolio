import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VercelAnalytics } from './vercel-analytics';

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <span data-testid="vercel-analytics" />,
}));

describe('VercelAnalytics', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders Vercel Web Analytics on Vercel deployments', () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');

    render(<VercelAnalytics />);

    expect(screen.getByTestId('vercel-analytics')).toBeInTheDocument();
  });

  it('renders nothing elsewhere, so /_vercel/insights is never requested', () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', '');

    const { container } = render(<VercelAnalytics />);

    expect(container).toBeEmptyDOMElement();
  });
});
