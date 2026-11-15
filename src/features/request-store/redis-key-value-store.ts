import type { Redis } from '@upstash/redis';
import type { KeyValueStore } from '@/lib/request-store/key-value-store';

export type RedisCommands = Pick<Redis, 'get' | 'set' | 'incr' | 'pexpire'>;

export function createRedisKeyValueStore(redis: RedisCommands): KeyValueStore {
  return {
    async readJson<Value>(key: string) {
      const storedValue = await redis.get<Value>(key);
      return storedValue ?? undefined;
    },
    async writeJson(key, value, { expiresInMs, onlyIfAbsent = false } = {}) {
      const expiry = expiresInMs === undefined ? {} : { px: Math.ceil(expiresInMs) };
      const setResult = await redis.set(
        key,
        value,
        onlyIfAbsent ? { ...expiry, nx: true } : expiry,
      );
      return setResult === 'OK';
    },
    async increment(key, expiresInMs) {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.pexpire(key, Math.ceil(expiresInMs));
      }
      return count;
    },
  };
}
