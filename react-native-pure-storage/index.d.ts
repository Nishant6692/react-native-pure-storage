declare module 'react-native-pure-storage' {
  export interface StorageOptions {
    /**
     * Whether to encrypt the data
     */
    encrypted?: boolean;
    
    /**
     * Skip the in-memory cache for this operation
     */
    skipCache?: boolean;
    
    /**
     * Default value to return if the key doesn't exist
     */
    default?: any;
  }
  
  export interface CacheOptions {
    /**
     * Maximum number of items to keep in cache (0 for unlimited)
     */
    maxSize?: number;
    
    /**
     * Time to live in milliseconds (0 for no expiry)
     */
    ttl?: number;
  }
  
  export interface StorageEvent {
    /**
     * The type of event
     */
    type: 'set' | 'remove' | 'clear';
    
    /**
     * The key that changed (undefined for clear events)
     */
    key?: string;
    
    /**
     * The new value (undefined for remove and clear events)
     */
    value?: any;
  }
  
  export interface CacheStats {
    /**
     * Number of cache hits
     */
    hits: number;
    
    /**
     * Number of cache misses
     */
    misses: number;
    
    /**
     * Number of items set in the cache
     */
    sets: number;
    
    /**
     * Number of items evicted from the cache
     */
    evictions: number;
    
    /**
     * Current number of items in the cache
     */
    size: number;
    
    /**
     * Cache hit rate (between 0 and 1)
     */
    hitRate: number;
  }
  
  export interface StorageInstanceOptions {
    /**
     * Namespace for the storage instance
     */
    namespace?: string;
    
    /**
     * Whether to encrypt all data by default
     */
    encrypted?: boolean;
    
    /**
     * Cache configuration or false to disable
     */
    cache?: CacheOptions | boolean;
  }

  export interface PureStorageInterface {
    /**
     * Store a value for a given key
     * @param key - The key to store the value under
     * @param value - The value to store (strings, numbers, booleans, objects)
     * @param options - Optional configuration
     * @returns A promise that resolves to true if successful
     */
    setItem(key: string, value: any, options?: StorageOptions): Promise<boolean>;

    /**
     * Synchronously store a value for a given key (when available)
     * @param key - The key to store the value under
     * @param value - The value to store (strings, numbers, booleans, objects)
     * @param options - Optional configuration
     * @returns true if successful
     * @throws If synchronous API is not available
     */
    setItemSync(key: string, value: any, options?: StorageOptions): boolean;

    /**
     * Get a value for a given key
     * @param key - The key to retrieve the value for
     * @param options - Optional configuration
     * @returns A promise that resolves to the stored value, or null if not found
     */
    getItem<T = any>(key: string, options?: StorageOptions): Promise<T | null>;

    /**
     * Synchronously get a value for a given key (when available)
     * @param key - The key to retrieve the value for
     * @param options - Optional configuration
     * @returns The stored value, or null if not found
     * @throws If synchronous API is not available
     */
    getItemSync<T = any>(key: string, options?: StorageOptions): T | null;

    /**
     * Remove a value for a given key
     * @param key - The key to remove
     * @returns A promise that resolves to true if successful
     */
    removeItem(key: string): Promise<boolean>;

    /**
     * Clear all stored values
     * @returns A promise that resolves to true if successful
     */
    clear(): Promise<boolean>;

    /**
     * Get all keys stored in the storage
     * @returns A promise that resolves to an array of keys
     */
    getAllKeys(): Promise<string[]>;

    /**
     * Set multiple key-value pairs at once
     * @param keyValuePairs - Object with key-value pairs to store
     * @param options - Optional configuration
     * @returns A promise that resolves to true if successful
     */
    multiSet(keyValuePairs: Record<string, any>, options?: StorageOptions): Promise<boolean>;

    /**
     * Get multiple values for a set of keys
     * @param keys - Array of keys to retrieve
     * @param options - Optional configuration
     * @returns A promise that resolves to an object of key-value pairs
     */
    multiGet<T = Record<string, any>>(keys: string[], options?: StorageOptions): Promise<T>;

    /**
     * Remove multiple keys and their values
     * @param keys - Array of keys to remove
     * @returns A promise that resolves to true if successful
     */
    multiRemove(keys: string[]): Promise<boolean>;

    /**
     * Check if a key exists in storage
     * @param key - The key to check
     * @param options - Optional configuration
     * @returns A promise that resolves to true if the key exists
     */
    hasKey(key: string, options?: StorageOptions): Promise<boolean>;
    
    /**
     * Create a new storage instance with its own namespace
     * @param namespace - The namespace to use
     * @param options - Optional configuration
     * @returns A new storage instance
     */
    getInstance(namespace: string, options?: StorageInstanceOptions): StorageInstance;
    
    /**
     * Configure the cache
     * @param options - Cache options or false to disable
     */
    configureCache(options: CacheOptions | boolean): void;
    
    /**
     * Add a listener for storage changes
     * @param callback - The callback to call when any value changes
     * @returns A function to remove the listener
     */
    onChange(callback: (event: StorageEvent) => void): () => void;
    
    /**
     * Add a listener for changes to a specific key
     * @param key - The key to watch
     * @param callback - The callback to call when the key changes
     * @returns A function to remove the listener
     */
    onKeyChange(key: string, callback: (event: StorageEvent) => void): () => void;
    
    /**
     * Get cache statistics
     * @returns Cache statistics
     */
    getCacheStats(): CacheStats;
    
    /**
     * Reset cache statistics
     */
    resetCacheStats(): void;
  }
  
  export interface StorageInstance extends PureStorageInterface {
    /**
     * The namespace for this storage instance
     */
    namespace: string;
    
    /**
     * Whether this storage instance encrypts all data by default
     */
    encrypted: boolean;
  }

  export interface BenchmarkResult {
    name: string;
    totalTimeMs: number;
    opsPerSecond: number;
  }

  export interface BenchmarkInterface {
    /**
     * Run a performance benchmark
     * @param name - Name of the benchmark
     * @param fn - Function to benchmark
     * @param iterations - Number of iterations to run
     * @returns A promise that resolves to the benchmark results
     */
    run(name: string, fn: (i: number) => Promise<any>, iterations?: number): Promise<BenchmarkResult>;
    
    /**
     * Run all benchmarks
     * @param iterations - Number of iterations for each test
     * @returns A promise that resolves to the results of all benchmarks
     */
    runAll(iterations?: number): Promise<Record<string, BenchmarkResult>>;
    
    /**
     * Compare with another storage library (if available)
     * @param otherStorage - Other storage library with compatible API
     * @param iterations - Number of iterations
     */
    compareWith(otherStorage: any, iterations?: number): Promise<void>;
  }
  
  // Error classes
  export class StorageError extends Error {
    code: string;
    constructor(message: string, code?: string);
  }
  
  export class KeyError extends StorageError {
    constructor(message: string);
  }
  
  export class EncryptionError extends StorageError {
    constructor(message: string);
  }
  
  export class SerializationError extends StorageError {
    constructor(message: string);
  }
  
  export class SyncOperationError extends StorageError {
    constructor(message?: string);
  }

  const PureStorage: PureStorageInterface;
  export const Benchmark: BenchmarkInterface;
  export default PureStorage;
} 