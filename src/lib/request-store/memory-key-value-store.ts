import type { KeyValueStore } from './key-value-store';

interface StoredEntry {
  serializedValue: string;
  expiresAtMs: number | undefined;
}

// Tests and e2e only; Vercel always uses Redis
export function createMemoryKeyValueStore(readNowMs: () => number = Date.now): KeyValueStore {
  const entries = new Map<string, StoredEntry>();

  function readLiveEntry(key: string): StoredEntry | undefined {
    const entry = entries.get(key);
    if (entry?.expiresAtMs !== undefined && entry.expiresAtMs <= readNowMs()) {
      entries.delete(key);
      return undefined;
    }
    return entry;
  }

  function toExpiresAtMs(expiresInMs: number | undefined): number | undefined {
    return expiresInMs === undefined ? undefined : readNowMs() + expiresInMs;
  }

  return {
    readJson<Value>(key: string) {
      const entry = readLiveEntry(key);
      return Promise.resolve(entry ? (JSON.parse(entry.serializedValue) as Value) : undefined);
    },
    writeJson(key, value, { expiresInMs, onlyIfAbsent = false } = {}) {
      if (onlyIfAbsent && readLiveEntry(key)) {
        return Promise.resolve(false);
      }
      entries.set(key, {
        serializedValue: JSON.stringify(value),
        expiresAtMs: toExpiresAtMs(expiresInMs),
      });
      return Promise.resolve(true);
    },
    increment(key, expiresInMs) {
      const entry = readLiveEntry(key);
      const count = (entry ? Number(entry.serializedValue) : 0) + 1;
      entries.set(key, {
        serializedValue: String(count),
        expiresAtMs: entry ? entry.expiresAtMs : toExpiresAtMs(expiresInMs),
      });
      return Promise.resolve(count);
    },
  };
}
