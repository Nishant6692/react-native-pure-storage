declare module 'react-native-pure-storage' {
  export interface PureStorageInterface {
    /**
     * Store a value for a given key
     * @param key - The key to store the value under
     * @param value - The value to store (must be a string)
     * @returns A promise that resolves to true if successful
     */
    setItem(key: string, value: string): Promise<boolean>;

    /**
     * Get a value for a given key
     * @param key - The key to retrieve the value for
     * @returns A promise that resolves to the stored value, or null if not found
     */
    getItem(key: string): Promise<string | null>;

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
  }

  const PureStorage: PureStorageInterface;
  export default PureStorage;
} 