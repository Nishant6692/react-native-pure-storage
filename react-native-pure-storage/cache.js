/**
 * Creates an in-memory cache for faster storage access
 */
export const createCache = (options = {}) => {
  const { maxSize = 100, ttl = 0 } = options;
  const cache = new Map();
  const expiry = new Map();
  
  // Stats for monitoring
  const stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0
  };
  
  /**
   * Get an item from the cache
   * @param {string} key - The key to retrieve
   * @returns {any} The cached value or undefined if not found
   */
  const get = (key) => {
    if (!cache.has(key)) {
      stats.misses++;
      return undefined;
    }
    
    // Check if the item has expired
    if (ttl > 0) {
      const expires = expiry.get(key);
      if (expires && Date.now() > expires) {
        // Remove expired item
        cache.delete(key);
        expiry.delete(key);
        stats.evictions++;
        stats.misses++;
        return undefined;
      }
    }
    
    stats.hits++;
    return cache.get(key);
  };
  
  /**
   * Store an item in the cache
   * @param {string} key - The key to store under
   * @param {any} value - The value to store
   * @param {number} [customTtl] - Optional custom TTL for this item
   */
  const set = (key, value, customTtl) => {
    stats.sets++;
    
    // Evict oldest item if we're at capacity
    if (maxSize > 0 && cache.size >= maxSize && !cache.has(key)) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
      expiry.delete(oldestKey);
      stats.evictions++;
    }
    
    cache.set(key, value);
    
    // Set expiry if TTL is specified
    if (customTtl > 0 || ttl > 0) {
      const expiryTime = Date.now() + (customTtl > 0 ? customTtl : ttl);
      expiry.set(key, expiryTime);
    }
  };
  
  /**
   * Remove an item from the cache
   * @param {string} key - The key to remove
   */
  const remove = (key) => {
    cache.delete(key);
    expiry.delete(key);
  };
  
  /**
   * Clear all items from the cache
   */
  const clear = () => {
    cache.clear();
    expiry.clear();
  };
  
  /**
   * Get the number of items in the cache
   * @returns {number} The number of cached items
   */
  const size = () => {
    return cache.size;
  };
  
  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  const getStats = () => {
    return {
      ...stats,
      size: cache.size,
      hitRate: stats.hits / (stats.hits + stats.misses || 1)
    };
  };
  
  /**
   * Reset cache statistics
   */
  const resetStats = () => {
    stats.hits = 0;
    stats.misses = 0;
    stats.sets = 0;
    stats.evictions = 0;
  };
  
  return {
    get,
    set,
    remove,
    clear,
    size,
    getStats,
    resetStats
  };
};

/**
 * A null cache implementation for when caching is disabled
 */
export const createNullCache = () => {
  return {
    get: () => undefined,
    set: () => {},
    remove: () => {},
    clear: () => {},
    size: () => 0,
    getStats: () => ({ hits: 0, misses: 0, sets: 0, evictions: 0, size: 0, hitRate: 0 }),
    resetStats: () => {}
  };
}; 