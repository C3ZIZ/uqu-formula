// A small in-memory cache so a rush of readers causes only one database query.
export interface TtlCache<T> {
  get(): Promise<T>;
  invalidate(): void;
}

/** Creates a cache that keeps one loaded value for a set time and shares in-flight loads. */
export function createTtlCache<T>(load: () => Promise<T>, ttlMs: number, now: () => number = Date.now): TtlCache<T> {
  let value: Promise<T> | undefined;
  let expiresAt = 0;

  return {
    /** Returns the cached value, loading it if missing or expired. */
    get() {
      if (value && now() < expiresAt) return value;
      const loading = load().catch((error) => {
        if (value === loading) value = undefined;
        throw error;
      });
      value = loading;
      expiresAt = now() + ttlMs;
      return loading;
    },
    /** Forgets the cached value. */
    invalidate() {
      value = undefined;
    },
  };
}
