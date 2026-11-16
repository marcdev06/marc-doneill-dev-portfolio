export interface WriteOptions {
  expiresInMs?: number;
  onlyIfAbsent?: boolean;
}

export interface KeyValueStore {
  readJson<Value>(key: string): Promise<Value | undefined>;
  writeJson(key: string, value: unknown, options?: WriteOptions): Promise<boolean>;
  increment(key: string, expiresInMs: number): Promise<number>;
}
