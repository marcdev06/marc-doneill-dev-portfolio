import { describe, expect, it } from 'vitest';
import { formatIsoMonth, isoMonthSchema } from './iso-month';

describe('isoMonthSchema', () => {
  it('accepts a four-digit year and a two-digit month', () => {
    expect(isoMonthSchema.safeParse('2025-09').success).toBe(true);
  });

  it.each(['2025-9', '2025-13', '25-09', '2025-09-01'])('rejects %s', (invalidMonth) => {
    const parseResult = isoMonthSchema.safeParse(invalidMonth);

    expect(parseResult.error?.issues[0]?.message).toBe('Use an ISO month such as 2025-09');
  });
});

describe('formatIsoMonth', () => {
  it.each([
    ['2025-09', 'Sep 2025'],
    ['2022-03', 'Mar 2022'],
    ['2023-12', 'Dec 2023'],
  ])('formats %s as %s', (isoMonth, expectedLabel) => {
    expect(formatIsoMonth(isoMonth)).toBe(expectedLabel);
  });

  it.each(['', '2025-13', 'not-a-month'])('throws for %j', (invalidMonth) => {
    expect(() => formatIsoMonth(invalidMonth)).toThrow(RangeError);
  });
});
