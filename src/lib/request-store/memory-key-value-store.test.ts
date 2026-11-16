import { describe, expect, it } from 'vitest';
import { createMemoryKeyValueStore } from './memory-key-value-store';

function createClock(startMs = 1_000) {
  let nowMs = startMs;
  return {
    readNowMs: () => nowMs,
    advanceBy: (elapsedMs: number) => {
      nowMs += elapsedMs;
    },
  };
}

describe('createMemoryKeyValueStore', () => {
  it('stores JSON values and reads back copies', async () => {
    const store = createMemoryKeyValueStore();
    const storedValue = { name: 'Jane', tags: ['a'] };

    expect(await store.writeJson('person', storedValue)).toBe(true);
    storedValue.tags.push('b');

    expect(await store.readJson('person')).toEqual({ name: 'Jane', tags: ['a'] });
    expect(await store.readJson('missing')).toBeUndefined();
  });

  it('expires values after their lifetime', async () => {
    const clock = createClock();
    const store = createMemoryKeyValueStore(clock.readNowMs);
    await store.writeJson('short-lived', 'value', { expiresInMs: 100 });

    clock.advanceBy(99);
    expect(await store.readJson('short-lived')).toBe('value');
    clock.advanceBy(1);
    expect(await store.readJson('short-lived')).toBeUndefined();
  });

  it('writes only-if-absent values once, and again after they expire', async () => {
    const clock = createClock();
    const store = createMemoryKeyValueStore(clock.readNowMs);

    expect(
      await store.writeJson('decision', 'approved', { onlyIfAbsent: true, expiresInMs: 10 }),
    ).toBe(true);
    expect(await store.writeJson('decision', 'denied', { onlyIfAbsent: true })).toBe(false);
    expect(await store.readJson('decision')).toBe('approved');

    clock.advanceBy(10);
    expect(await store.writeJson('decision', 'denied', { onlyIfAbsent: true })).toBe(true);
    expect(await store.readJson('decision')).toBe('denied');
  });

  it('counts within a window that starts at the first increment', async () => {
    const clock = createClock();
    const store = createMemoryKeyValueStore(clock.readNowMs);

    expect(await store.increment('hits', 1_000)).toBe(1);
    clock.advanceBy(600);
    expect(await store.increment('hits', 1_000)).toBe(2);
    clock.advanceBy(400);
    expect(await store.increment('hits', 1_000)).toBe(1);
  });

  it('uses the real clock by default', async () => {
    const store = createMemoryKeyValueStore();
    await store.writeJson('soon-gone', 'value', { expiresInMs: 60_000 });

    expect(await store.readJson('soon-gone')).toBe('value');
  });
});
