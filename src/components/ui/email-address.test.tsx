import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmailAddress } from './email-address';

describe('EmailAddress', () => {
  it('offers a line break only after the @', () => {
    render(
      <a href="mailto:jane.doe@example.com">
        <EmailAddress address="jane.doe@example.com" />
      </a>,
    );

    const emailLink = screen.getByRole('link', { name: 'jane.doe@example.com' });
    const addressSpan = emailLink.querySelector('span');
    expect(emailLink.children).toHaveLength(1);
    expect(addressSpan?.innerHTML).toBe('jane.doe@<wbr>example.com');
  });
});
