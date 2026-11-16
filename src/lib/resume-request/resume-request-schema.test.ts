import { describe, expect, it } from 'vitest';
import {
  buildResumeDownloadPath,
  buildResumeRequestStatusPath,
  emptyResumeRequestFieldValues,
} from './resume-request-fields';
import { parseResumeRequest, readCountryCode } from './resume-request-schema';

const validValues = { name: 'Jane Doe', email: 'jane@example.com', note: 'A contract role.' };

describe('parseResumeRequest', () => {
  it('trims fields, strips line breaks from the name and keeps the note', () => {
    expect(
      parseResumeRequest({
        name: ' Jane\r\nDoe ',
        email: ' jane@example.com ',
        note: ' Hiring for\na contract role. ',
      }),
    ).toEqual({
      isValid: true,
      submission: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        note: 'Hiring for\na contract role.',
      },
    });
  });

  it('treats a blank note as no note', () => {
    expect(parseResumeRequest({ ...validValues, note: '   ' })).toEqual({
      isValid: true,
      submission: { name: 'Jane Doe', email: 'jane@example.com', note: undefined },
    });
  });

  it.each([
    [{ ...validValues, name: 'J' }, ['name']],
    [{ ...validValues, name: 'J'.repeat(101) }, ['name']],
    [{ ...validValues, email: 'jane@example' }, ['email']],
    [{ ...validValues, email: `${'j'.repeat(250)}@example.com` }, ['email']],
    [{ ...validValues, note: 'n'.repeat(501) }, ['note']],
    [emptyResumeRequestFieldValues, ['name', 'email']],
  ])('names the invalid fields for %j', (submittedValues, invalidFields) => {
    expect(parseResumeRequest(submittedValues)).toEqual({ isValid: false, invalidFields });
  });

  it('accepts the longest allowed values', () => {
    expect(
      parseResumeRequest({
        name: 'J'.repeat(100),
        email: `${'j'.repeat(242)}@example.com`,
        note: 'n'.repeat(500),
      }).isValid,
    ).toBe(true);
  });
});

describe('readCountryCode', () => {
  it.each([
    ['PH', 'PH'],
    [' gb ', 'GB'],
    ['PHL', undefined],
    ['<b>', undefined],
    ['', undefined],
    [null, undefined],
  ])('reads %j as %j', (countryHeader, expectedCountry) => {
    expect(readCountryCode(countryHeader)).toBe(expectedCountry);
  });
});

describe('resume request paths', () => {
  it('builds the status and download paths with encoded values', () => {
    expect(buildResumeRequestStatusPath('abc-123')).toBe('/api/resume-requests/abc-123/status');
    expect(buildResumeRequestStatusPath('a/b')).toBe('/api/resume-requests/a%2Fb/status');
    expect(buildResumeDownloadPath('grant+token')).toBe('/api/resume/download?grant=grant%2Btoken');
  });
});
