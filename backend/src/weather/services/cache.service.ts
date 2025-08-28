import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessedAt: number;
}

@Injectable()
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly ttlMilliseconds: number;
  private readonly maxCacheSize: number;
  private readonly maxMemoryMB: number;

  constructor(private configService: ConfigService) {
    const ttlSeconds = this.configService.get<number>('cache.ttlSeconds', 600);
    this.ttlMilliseconds = ttlSeconds * 1000;
    this.maxCacheSize = this.configService.get<number>(
      'cache.maxEntries',
      1000,
    );
    this.maxMemoryMB = this.configService.get<number>('cache.maxMemoryMB', 50);

    this.startCleanupInterval();
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update last accessed time for LRU
    entry.lastAccessedAt = Date.now();

    return entry.value;
  }

  set<T>(key: string, value: T, ttlSeconds?: number): void {
    // Check if we need to evict items before adding new one
    this.enforceMemoryLimit();
    this.enforceSizeLimit();

    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.ttlMilliseconds;
    const now = Date.now();
    const expiresAt = now + ttl;
    this.cache.set(key, { value, expiresAt, lastAccessedAt: now });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, 60000);
  }

  private enforceSizeLimit(): void {
    // If cache size exceeds max, remove least recently used entries
    if (this.cache.size >= this.maxCacheSize) {
      const entriesToRemove = Math.floor(this.maxCacheSize * 0.1); // Remove 10% of entries
      this.evictLRU(entriesToRemove);
    }
  }

  private enforceMemoryLimit(): void {
    // Rough estimation of memory usage
    const estimatedMemoryMB = this.estimateMemoryUsage();

    if (estimatedMemoryMB > this.maxMemoryMB) {
      // Evict 20% of least recently used entries
      const entriesToRemove = Math.floor(this.cache.size * 0.2);
      this.evictLRU(entriesToRemove);
    }
  }

  private evictLRU(count: number): void {
    if (count <= 0) return;

    // Sort entries by lastAccessedAt (oldest first)
    const sortedEntries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt,
    );

    // Remove the oldest entries
    for (let i = 0; i < Math.min(count, sortedEntries.length); i++) {
      this.cache.delete(sortedEntries[i][0]);
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation: convert cache to JSON string and get byte size
    try {
      const cacheArray = Array.from(this.cache.entries());
      const jsonString = JSON.stringify(cacheArray);
      const bytes = new TextEncoder().encode(jsonString).length;
      return bytes / (1024 * 1024); // Convert to MB
    } catch {
      // If serialization fails, use a simple count-based estimation
      // Assume average entry is ~1KB
      return (this.cache.size * 1024) / (1024 * 1024);
    }
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      estimatedMemoryMB: this.estimateMemoryUsage(),
      maxMemoryMB: this.maxMemoryMB,
    };
  }
}
