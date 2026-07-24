/**
 * Speed & Performance Utilities
 * Modern O(1) indexing, debouncing, and memoization for lightning-fast UI responses
 */

/**
 * Creates O(1) fast lookup index map from an array by key
 */
export function buildIndexMap<T>(items: T[], keyExtractor: (item: T) => string): Map<string, T> {
  const map = new Map<string, T>();
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const key = keyExtractor(item);
    if (key) {
      map.set(key.toLowerCase(), item);
    }
  }
  return map;
}

/**
 * High performance debounce wrapper with immediate execution option
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    }, wait);

    if (callNow) func.apply(context, args);
  };
}

/**
 * Fast LRU Memoization Cache for expensive dashboard aggregations
 */
export function memoizeFast<Args extends any[], Result>(
  fn: (...args: Args) => Result,
  maxCacheSize: number = 50
): (...args: Args) => Result {
  const cache = new Map<string, Result>();

  return (...args: Args): Result => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    if (cache.size >= maxCacheSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(key, result);
    return result;
  };
}
