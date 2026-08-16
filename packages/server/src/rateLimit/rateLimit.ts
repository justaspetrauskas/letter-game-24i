export interface RateLimiterOptions {
  capacity: number;
  refillMs: number;
  now?: () => number;
  maxKeys?: number;
}

export interface RateLimiter {
  take: (key: string) => boolean;
  retryAfterMs: (key: string) => number;
  size: () => number;
}

interface Bucket {
  tokens: number;
  updatedAtMs: number;
}

const DEFAULT_MAX_KEYS = 5000;

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { capacity, refillMs } = options;
  const now = options.now ?? (() => Date.now());
  const maxKeys = options.maxKeys ?? DEFAULT_MAX_KEYS;
  const buckets = new Map<string, Bucket>();

  const prune = (currentMs: number): void => {
    if (buckets.size <= maxKeys) {
      return;
    }
    const staleBefore = currentMs - refillMs * capacity;
    for (const [key, bucket] of buckets) {
      if (bucket.updatedAtMs < staleBefore) {
        buckets.delete(key);
      }
    }
  };

  const refresh = (key: string): Bucket => {
    const currentMs = now();
    const bucket = buckets.get(key);

    if (!bucket) {
      const created = { tokens: capacity, updatedAtMs: currentMs };
      prune(currentMs);
      buckets.set(key, created);
      return created;
    }

    const earned = Math.floor((currentMs - bucket.updatedAtMs) / refillMs);
    if (earned > 0) {
      bucket.tokens = Math.min(capacity, bucket.tokens + earned);
      bucket.updatedAtMs += earned * refillMs;
    }
    return bucket;
  };

  return {
    take(key) {
      const bucket = refresh(key);
      if (bucket.tokens <= 0) {
        return false;
      }
      bucket.tokens -= 1;
      return true;
    },

    retryAfterMs(key) {
      const bucket = refresh(key);
      if (bucket.tokens > 0) {
        return 0;
      }
      return Math.max(0, bucket.updatedAtMs + refillMs - now());
    },

    size() {
      return buckets.size;
    },
  };
}
