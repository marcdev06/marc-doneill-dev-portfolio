import { describe, expect, it } from 'vitest';
import { computeContentHash, toCanonicalJson } from './content-hash';

describe('toCanonicalJson', () => {
  it('sorts object keys at every depth and keeps array order', () => {
    const value = { beta: [3, { zeta: 1, alpha: 2 }], alpha: 'text' };

    expect(toCanonicalJson(value)).toBe('{"alpha":"text","beta":[3,{"alpha":2,"zeta":1}]}');
  });

  it('drops undefined object values the way JSON does', () => {
    expect(toCanonicalJson({ missing: undefined, empty: null })).toBe('{"empty":null}');
  });

  it('serializes strings, booleans and finite numbers', () => {
    expect(toCanonicalJson(['quote "me"', true, -1.5])).toBe('["quote \\"me\\"",true,-1.5]');
  });

  it.each([
    ['undefined', undefined],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['a function', () => 'value'],
    ['a symbol', Symbol('marker')],
    ['a bigint', BigInt(10)],
  ])('rejects %s', (_label, unsupportedValue) => {
    expect(() => toCanonicalJson(unsupportedValue)).toThrow(TypeError);
  });
});

describe('computeContentHash', () => {
  it('returns the SHA-256 hex digest of the canonical JSON', () => {
    expect(computeContentHash({})).toBe(
      '44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a',
    );
  });

  it('gives the same hash whatever the key order', () => {
    expect(computeContentHash({ first: 1, second: 2 })).toBe(
      computeContentHash({ second: 2, first: 1 }),
    );
  });

  it('gives a different hash when any value changes', () => {
    expect(computeContentHash({ bullets: ['one'] })).not.toBe(
      computeContentHash({ bullets: ['one', 'two'] }),
    );
  });
});
