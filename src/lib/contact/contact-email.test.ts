import { describe, expect, it } from 'vitest';
import { composeContactEmail } from './contact-email';

describe('composeContactEmail', () => {
  it('builds a plain-text email that replies to the visitor', () => {
    expect(
      composeContactEmail({
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Hello Marc,\n\nLet us talk about a project.',
      }),
    ).toEqual({
      subject: 'Portfolio contact from Jane Doe',
      replyTo: 'jane@example.com',
      text: 'Name: Jane Doe\nEmail: jane@example.com\n\nHello Marc,\n\nLet us talk about a project.',
    });
  });

  it('keeps line breaks out of the subject even for unparsed names', () => {
    const email = composeContactEmail({
      name: 'Jane\r\nBcc: victim@example.com\n',
      email: 'jane@example.com',
      message: 'A message long enough to send.',
    });

    expect(email.subject).toBe('Portfolio contact from Jane Bcc: victim@example.com');
    expect(email.subject).not.toMatch(/[\r\n]/);
  });
});
