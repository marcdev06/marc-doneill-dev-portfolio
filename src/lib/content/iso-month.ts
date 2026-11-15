import { z } from 'zod';

const monthAbbreviations = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const isoMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use an ISO month such as 2025-09');

export function formatIsoMonth(isoMonth: string): string {
  const [yearText, monthText] = isoMonth.split('-');
  const monthAbbreviation = monthAbbreviations[Number(monthText) - 1];
  if (!yearText || !monthAbbreviation) {
    throw new RangeError(`"${isoMonth}" is not an ISO month such as 2025-09`);
  }
  return `${monthAbbreviation} ${yearText}`;
}
