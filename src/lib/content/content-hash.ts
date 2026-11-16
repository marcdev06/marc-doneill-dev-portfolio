import { createHash } from 'node:crypto';

function compareCodeUnits(leftKey: string, rightKey: string): number {
  return leftKey < rightKey ? -1 : 1;
}

export function toCanonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((element) => toCanonicalJson(element)).join(',')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    const definedEntries = Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([leftKey], [rightKey]) => compareCodeUnits(leftKey, rightKey));
    const serializedEntries = definedEntries.map(
      ([key, entryValue]) => `${JSON.stringify(key)}:${toCanonicalJson(entryValue)}`,
    );
    return `{${serializedEntries.join(',')}}`;
  }
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return JSON.stringify(value);
  }
  throw new TypeError(`Canonical JSON cannot represent a ${typeof value} value`);
}

export function computeContentHash(value: unknown): string {
  return createHash('sha256').update(toCanonicalJson(value)).digest('hex');
}
