declare module 'react-native-pure-storage' {
  export interface StorageOptions {
    /**
     * Whether to encrypt the data
     */
    encrypted?: boolean;
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
     * @returns A promise that resolves to the stored value, or null if not found
     */
    getItem<T = any>(key: string): Promise<T | null>;

    /**
     * Synchronously get a value for a given key (when available)
     * @param key - The key to retrieve the value for
     * @returns The stored value, or null if not found
     * @throws If synchronous API is not available
     */
    getItemSync<T = any>(key: string): T | null;

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
     * @returns A promise that resolves to an object of key-value pairs
     */
    multiGet<T = Record<string, any>>(keys: string[]): Promise<T>;

    /**
     * Remove multiple keys and their values
     * @param keys - Array of keys to remove
     * @returns A promise that resolves to true if successful
     */
    multiRemove(keys: string[]): Promise<boolean>;

    /**
     * Check if a key exists in storage
     * @param key - The key to check
     * @returns A promise that resolves to true if the key exists
     */
    hasKey(key: string): Promise<boolean>;
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

  const PureStorage: PureStorageInterface;
  export const Benchmark: BenchmarkInterface;
  export default PureStorage;
} 