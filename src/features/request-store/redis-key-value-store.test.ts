import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRedisKeyValueStore } from './redis-key-value-store';

function createFakeRedis() {
  return {
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    pexpire: vi.fn(),
  };
}

describe('createRedisKeyValueStore', () => {
  let fakeRedis: ReturnType<typeof createFakeRedis>;
  let store: ReturnType<typeof createRedisKeyValueStore>;

  beforeEach(() => {
    fakeRedis = createFakeRedis();
    store = createRedisKeyValueStore(fakeRedis);
  });

  it('reads JSON values and maps a missing key to undefined', async () => {
    fakeRedis.get.mockResolvedValueOnce({ status: 'approved' }).mockResolvedValueOnce(null);

    expect(await store.readJson('present')).toEqual({ status: 'approved' });
    expect(await store.readJson('missing')).toBeUndefined();
  });

  it('writes with a millisecond expiry and NX when asked', async () => {
    fakeRedis.set
      .mockResolvedValueOnce('OK')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('OK');

    expect(
      await store.writeJson(
        'decision',
        { decision: 'approved' },
        { expiresInMs: 1500.2, onlyIfAbsent: true },
      ),
    ).toBe(true);
    expect(await store.writeJson('decision', { decision: 'denied' }, { onlyIfAbsent: true })).toBe(
      false,
    );
    expect(await store.writeJson('pdf', 'bytes')).toBe(true);

    expect(fakeRedis.set.mock.calls).toEqual([
      ['decision', { decision: 'approved' }, { px: 1501, nx: true }],
      ['decision', { decision: 'denied' }, { nx: true }],
      ['pdf', 'bytes', {}],
    ]);
  });

  it('sets the expiry only on the first increment', async () => {
    fakeRedis.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    expect(await store.increment('hits', 60_000)).toBe(1);
    expect(await store.increment('hits', 60_000)).toBe(2);

    expect(fakeRedis.pexpire).toHaveBeenCalledTimes(1);
    expect(fakeRedis.pexpire).toHaveBeenCalledWith('hits', 60_000);
  });
});
