interface Entry {
  value: string;
  /** Absolute epoch ms this key expires at, or null if it never expires. */
  expiresAt: number | null;
}

export interface StoreStats {
  keyCount: number;
  /** Rough estimate of dataset size, not a measurement of actual process memory. */
  estimatedBytes: number;
}

// Rough per-entry overhead (Map slot + two V8 string object headers). Not
// exact — real string/object overhead varies by engine build and string
// length — but good enough to give a sense-of-scale estimate for the UI.
const ENTRY_OVERHEAD_BYTES = 48;

/**
 * In-memory key-value store with optional per-key TTL.
 *
 * Node.js runs the event loop on a single thread, so a single client
 * command executes to completion before the next one is dispatched — there
 * is no possibility of two commands interleaving mid-mutation. That makes
 * this Map safe to share across all client connections without explicit
 * locking, which is why every method here is synchronous.
 */
export class KeyValueStore {
  private readonly data = new Map<string, Entry>();

  set(key: string, value: string, ttlSeconds?: number): void {
    const expiresAt = ttlSeconds === undefined ? null : Date.now() + ttlSeconds * 1000;
    this.data.set(key, { value, expiresAt });
  }

  get(key: string): string | null {
    const entry = this.data.get(key);
    if (entry === undefined) return null;
    if (this.isExpired(entry)) {
      this.data.delete(key);
      return null;
    }
    return entry.value;
  }

  del(keys: string[]): number {
    let deleted = 0;
    for (const key of keys) {
      const entry = this.data.get(key);
      if (entry === undefined) continue;
      this.data.delete(key);
      if (!this.isExpired(entry)) deleted++;
    }
    return deleted;
  }

  /**
   * Walks the full key set to report live counts for the metrics endpoint.
   * Any expired entries encountered along the way are evicted, so polling
   * stats also serves as a form of passive active-expiration.
   */
  stats(): StoreStats {
    let keyCount = 0;
    let estimatedBytes = 0;

    for (const [key, entry] of this.data) {
      if (this.isExpired(entry)) {
        this.data.delete(key);
        continue;
      }
      keyCount++;
      estimatedBytes += ENTRY_OVERHEAD_BYTES + Buffer.byteLength(key) + Buffer.byteLength(entry.value);
    }

    return { keyCount, estimatedBytes };
  }

  private isExpired(entry: Entry): boolean {
    return entry.expiresAt !== null && entry.expiresAt <= Date.now();
  }
}
