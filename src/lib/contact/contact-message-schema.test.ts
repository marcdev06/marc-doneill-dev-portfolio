import { describe, expect, it } from 'vitest';
import type { ContactFieldValues } from './contact-fields';
import { parseContactSubmission } from './contact-message-schema';

const validValues: ContactFieldValues = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  message: 'I would like to talk about a contract project.',
};

function listInvalidFields(overrides: Partial<ContactFieldValues>) {
  const submission = parseContactSubmission({ ...validValues, ...overrides });
  return submission.isValid ? [] : submission.invalidFields;
}

describe('parseContactSubmission', () => {
  it('trims every field and replaces line breaks in the name', () => {
    expect(
      parseContactSubmission({
        name: '  Jane\r\n\nDoe  ',
        email: '  jane@example.com ',
        message: '\n  Hello there, this is a real message.\n\nThanks!  \n',
      }),
    ).toEqual({
      isValid: true,
      message: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Hello there, this is a real message.\n\nThanks!',
      },
    });
  });

  it('accepts names of 2 to 100 characters after trimming', () => {
    expect(listInvalidFields({ name: ' Al ' })).toEqual([]);
    expect(listInvalidFields({ name: 'n'.repeat(100) })).toEqual([]);
    expect(listInvalidFields({ name: '  A  ' })).toEqual(['name']);
    expect(listInvalidFields({ name: 'n'.repeat(101) })).toEqual(['name']);
    expect(listInvalidFields({ name: '\r\n' })).toEqual(['name']);
  });

  it('accepts valid emails up to 254 characters', () => {
    const longestEmail = `${'a'.repeat(64)}@${'b'.repeat(185)}.com`;
    expect(longestEmail).toHaveLength(254);
    expect(listInvalidFields({ email: longestEmail })).toEqual([]);
    expect(listInvalidFields({ email: `a${longestEmail}` })).toEqual(['email']);
    expect(listInvalidFields({ email: 'jane@example' })).toEqual(['email']);
    expect(listInvalidFields({ email: 'jane.example.com' })).toEqual(['email']);
    expect(listInvalidFields({ email: '' })).toEqual(['email']);
  });

  it('accepts messages of 20 to 5000 characters after trimming', () => {
    expect(listInvalidFields({ message: ` ${'m'.repeat(20)} ` })).toEqual([]);
    expect(listInvalidFields({ message: 'm'.repeat(5000) })).toEqual([]);
    expect(listInvalidFields({ message: ` ${'m'.repeat(19)}      ` })).toEqual(['message']);
    expect(listInvalidFields({ message: 'm'.repeat(5001) })).toEqual(['message']);
    expect(listInvalidFields({ message: ' '.repeat(30) })).toEqual(['message']);
  });

  it('lists invalid fields in form order, once each', () => {
    expect(listInvalidFields({ name: '', email: 'not an email', message: 'short' })).toEqual([
      'name',
      'email',
      'message',
    ]);
    expect(listInvalidFields({ message: '', email: 'e'.repeat(300) })).toEqual([
      'email',
      'message',
    ]);
  });
});
