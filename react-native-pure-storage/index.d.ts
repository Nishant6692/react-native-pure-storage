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
    
    /**
     * Whether to compress the data (binary data only)
     */
    compression?: boolean;
    
    /**
     * The type of binary data to return: 'ArrayBuffer', 'Uint8Array', etc.
     */
    returnType?: 'ArrayBuffer' | 'Uint8Array' | 'Int8Array' | 'Uint16Array' | 'Int16Array' | 'Uint32Array' | 'Int32Array' | 'Float32Array' | 'Float64Array';
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
     * Synchronously store a value for a given key (via JSI when available)
     * @param key - The key to store the value under
     * @param value - The value to store (strings, numbers, booleans, objects)
     * @param options - Optional configuration
     * @returns true if successful
     * @throws If JSI is not available and the platform doesn't support synchronous operations
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
     * Synchronously get a value for a given key (via JSI when available)
     * @param key - The key to retrieve the value for
     * @param options - Optional configuration
     * @returns The stored value, or null if not found
     * @throws If JSI is not available and the platform doesn't support synchronous operations
     */
    getItemSync<T = any>(key: string, options?: StorageOptions): T | null;

    /**
     * Remove a value for a given key
     * @param key - The key to remove
     * @returns A promise that resolves to true if successful
     */
    removeItem(key: string): Promise<boolean>;

    /**
     * Synchronously remove a value for a given key (via JSI when available)
     * @param key - The key to remove
     * @returns true if successful
     * @throws If JSI is not available and the platform doesn't support synchronous operations
     */
    removeItemSync(key: string): boolean;

    /**
     * Clear all stored values
     * @returns A promise that resolves to true if successful
     */
    clear(): Promise<boolean>;

    /**
     * Synchronously clear all stored values (via JSI when available)
     * @returns true if successful
     * @throws If JSI is not available and the platform doesn't support synchronous operations
     */
    clearSync(): boolean;

    /**
     * Get all keys stored in the storage
     * @returns A promise that resolves to an array of keys
     */
    getAllKeys(): Promise<string[]>;

    /**
     * Synchronously get all keys stored in the storage (via JSI when available)
     * @returns An array of keys
     * @throws If JSI is not available and the platform doesn't support synchronous operations
     */
    getAllKeysSync(): string[];

    /**
     * Set multiple key-value pairs at once
     * @param keyValuePairs - Object with key-value pairs to store
     * @param options - Optional configuration
     * @returns A promise that resolves to true if successful
     */
    multiSet(keyValuePairs: Record<string, any>, options?: StorageOptions): Promise<boolean>;

    /**
     * Synchronously set multiple key-value pairs at once (via JSI when available)
     * @param keyValuePairs - Object with key-value pairs to store
     * @param options - Optional configuration
     * @returns true if successful
     * @throws If JSI is not available and the platform doesn't support synchronous operations
     */
    multiSetSync(keyValuePairs: Record<string, any>, options?: StorageOptions): boolean;

    /**
     * Get multiple values for a set of keys
     * @param keys - Array of keys to retrieve
     * @param options - Optional configuration
     * @returns A promise that resolves to an object of key-value pairs
     */
    multiGet<T = Record<string, any>>(keys: string[], options?: StorageOptions): Promise<T>;

    /**
     * Synchronously get multiple values for a set of keys (via JSI when available)
     * @param keys - Array of keys to retrieve
     * @param options - Optional configuration
     * @returns An object of key-value pairs
     * @throws If JSI is not available and the platform doesn't support synchronous operations
     */
    multiGetSync<T = Record<string, any>>(keys: string[], options?: StorageOptions): T;

    /**
     * Remove multiple keys and their values
     * @param keys - Array of keys to remove
     * @returns A promise that resolves to true if successful
     */
    multiRemove(keys: string[]): Promise<boolean>;

    /**
     * Synchronously remove multiple keys and their values (via JSI when available)
     * @param keys - Array of keys to remove
     * @returns true if successful
     * @throws If JSI is not available and the platform doesn't support synchronous operations
     */
    multiRemoveSync(keys: string[]): boolean;

    /**
     * Check if a key exists in storage
     * @param key - The key to check
     * @param options - Optional configuration
     * @returns A promise that resolves to true if the key exists
     */
    hasKey(key: string, options?: StorageOptions): Promise<boolean>;

    /**
     * Synchronously check if a key exists in storage (via JSI when available)
     * @param key - The key to check
     * @param options - Optional configuration
     * @returns true if the key exists 
     * @throws If JSI is not available and the platform doesn't support synchronous operations
     */
    hasKeySync(key: string, options?: StorageOptions): boolean;
    
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

    /**
     * Store binary data for a given key
     * @param key - The key to store the binary data under
     * @param data - The binary data to store (ArrayBuffer or TypedArray)
     * @param options - Optional configuration including compression
     * @returns A promise that resolves to true if successful
     */
    setBinaryItem(key: string, data: ArrayBuffer | Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array, options?: StorageOptions): Promise<boolean>;

    /**
     * Get binary data for a given key
     * @param key - The key to retrieve the binary data for
     * @param options - Optional configuration including return type
     * @returns A promise that resolves to the binary data, or null if not found
     */
    getBinaryItem<T extends ArrayBuffer | Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array = Uint8Array>(
      key: string, 
      options?: StorageOptions
    ): Promise<T | null>;

    /**
     * Synchronously store binary data for a given key
     * @param key - The key to store the binary data under
     * @param data - The binary data to store (ArrayBuffer or TypedArray)
     * @param options - Optional configuration including compression
     * @returns true if successful
     * @throws If JSI is not available, or if the data is not binary
     */
    setBinaryItemSync(key: string, data: ArrayBuffer | Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array, options?: StorageOptions): boolean;

    /**
     * Synchronously get binary data for a given key
     * @param key - The key to retrieve the binary data for
     * @param options - Optional configuration including return type
     * @returns The binary data, or null if not found
     * @throws If JSI is not available, or if the data cannot be converted to binary
     */
    getBinaryItemSync<T extends ArrayBuffer | Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array = Uint8Array>(
      key: string, 
      options?: StorageOptions
    ): T | null;

    /**
     * Check if binary data is cached in memory
     * @param key - The key to check
     * @returns Whether the binary data is in cache
     */
    isBinaryCached(key: string): boolean;

    /**
     * Access to low-level JSI methods
     */
    jsi: {
      /**
       * Whether JSI synchronous access is available
       */
      isAvailable: boolean;
      
      /**
       * Get all keys synchronously (JSI only)
       * @returns {Array<string>} Array of keys
       * @throws {Error} If JSI is not available
       */
      getAllKeysSync(): string[];
      
      /**
       * Clear all storage synchronously (JSI only)
       * @returns {boolean} Success
       * @throws {Error} If JSI is not available
       */
      clearSync(): boolean;
      
      /**
       * Remove an item synchronously (JSI only)
       * @param key Key to remove
       * @returns {boolean} Success
       * @throws {Error} If JSI is not available
       */
      removeItemSync(key: string): boolean;
      
      /**
       * Check if a key exists synchronously (JSI only)
       * @param key Key to check
       * @returns {boolean} Whether the key exists
       * @throws {Error} If JSI is not available
       */
      hasKeySync(key: string): boolean;
      
      /**
       * Set multiple items synchronously (JSI only)
       * @param keyValuePairs Object of key-value pairs
       * @param options Storage options
       * @returns {boolean} Success
       * @throws {Error} If JSI is not available
       */
      multiSetSync(keyValuePairs: Record<string, any>, options?: StorageOptions): boolean;
      
      /**
       * Get multiple items synchronously (JSI only)
       * @param keys Array of keys to retrieve
       * @param options Storage options
       * @returns {Object} Object of key-value pairs
       * @throws {Error} If JSI is not available
       */
      multiGetSync<T = Record<string, any>>(keys: string[], options?: StorageOptions): T;
      
      /**
       * Remove multiple items synchronously (JSI only)
       * @param keys Array of keys to remove
       * @returns {boolean} Success
       * @throws {Error} If JSI is not available
       */
      multiRemoveSync(keys: string[]): boolean;
    };
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
  export default PureStorage;

  // Export FileStorage utilities
  export interface FileMetadata {
    /**
     * Original URI of the file
     */
    uri?: string;
    
    /**
     * When the file was stored
     */
    dateStored?: string;
    
    /**
     * File format (for images)
     */
    format?: string;
    
    /**
     * File width (for images)
     */
    width?: number;
    
    /**
     * File height (for images)
     */
    height?: number;
    
    /**
     * Original file name
     */
    name?: string;
    
    /**
     * File MIME type
     */
    type?: string;
    
    /**
     * File size in bytes
     */
    size?: number;
    
    /**
     * File title
     */
    title?: string;
    
    /**
     * Array of tags
     */
    tags?: string[];
    
    /**
     * Any additional metadata
     */
    [key: string]: any;
  }
  
  export interface FileStorageOptions extends StorageOptions {
    /**
     * Additional metadata to store with the file
     */
    metadata?: FileMetadata;
    
    /**
     * Image format (jpeg or png)
     */
    format?: 'jpeg' | 'png';
    
    /**
     * Image quality (0.0-1.0)
     */
    quality?: number;
  }
  
  export interface FileResult {
    /**
     * Binary data of the file
     */
    data: Uint8Array | null;
    
    /**
     * File metadata
     */
    metadata: FileMetadata | null;
  }
  
  export interface ImageResult {
    /**
     * Data URI for the image (data:image/jpeg;base64,...)
     */
    uri: string | null;
    
    /**
     * Image metadata
     */
    metadata: FileMetadata | null;
  }
  
  export interface FileInfo {
    /**
     * Storage key
     */
    key: string;
    
    /**
     * File metadata
     */
    metadata: FileMetadata | null;
  }
  
  export class FileStorage {
    /**
     * Store a file from a URI
     * @param key - The key to store the file under
     * @param uri - The URI of the file (file://, content://, etc.)
     * @param options - Storage options
     * @returns Whether the operation succeeded
     */
    static storeFile(key: string, uri: string, options?: FileStorageOptions): Promise<boolean>;
    
    /**
     * Retrieve a file as a binary object
     * @param key - The key the file was stored under
     * @param options - Retrieval options
     * @returns File data and metadata
     */
    static getFile(key: string, options?: StorageOptions): Promise<FileResult>;
    
    /**
     * Store an image from a URI
     * @param key - The key to store the image under
     * @param uri - The URI of the image
     * @param options - Storage options
     * @returns Whether the operation succeeded
     */
    static storeImage(key: string, uri: string, options?: FileStorageOptions): Promise<boolean>;
    
    /**
     * Retrieve an image as a base64 data URI
     * @param key - The key the image was stored under
     * @param options - Retrieval options
     * @returns Image URI and metadata
     */
    static getImage(key: string, options?: StorageOptions): Promise<ImageResult>;
    
    /**
     * Save an image or file to the filesystem
     * @param key - The key the file is stored under
     * @param destinationPath - Path to save the file to
     * @param options - Options for retrieval
     * @returns The path the file was saved to, or null on failure
     */
    static saveToFilesystem(key: string, destinationPath: string, options?: StorageOptions): Promise<string | null>;
    
    /**
     * List all stored files
     * @param prefix - Optional prefix to filter by
     * @returns List of files
     */
    static listFiles(prefix?: string): Promise<FileInfo[]>;
    
    /**
     * Delete a file and its metadata
     * @param key - The key of the file to delete
     * @returns Whether the operation succeeded
     */
    static deleteFile(key: string): Promise<boolean>;
    
    /**
     * Get the size of a stored file in bytes
     * @param key - The key of the file
     * @returns Size in bytes or null if not found
     */
    static getFileSize(key: string): Promise<number | null>;
  }
  
  export { FileStorage };

  /**
   * Decompresses binary data using Run-Length Encoding (RLE)
   * @param compressedData The compressed data as a Uint8Array
   * @param originalSize The original size of the uncompressed data
   * @param isCompressed Whether the data is actually compressed (pass false to return the original)
   * @returns The decompressed data as a Uint8Array
   */
  function decompressBinary(compressedData: Uint8Array, originalSize: number, isCompressed: boolean): Uint8Array;

  /**
   * Represents metadata associated with a stored file
   */
  interface FileMetadata {
    /** Original URI of the file */
    uri?: string;
    /** Date when the file was stored */
    dateStored?: string;
    /** File format (jpeg, png, pdf, etc.) */
    format?: string;
    /** Image width (for images) */
    width?: number;
    /** Image height (for images) */
    height?: number;
    /** File name */
    name?: string;
    /** MIME type of the file */
    type?: string;
    /** File size in bytes */
    size?: number;
    /** Title of the file */
    title?: string;
    /** Array of tags associated with the file */
    tags?: string[];
    /** Any additional metadata */
    [key: string]: any;
  }

  /**
   * Options for file storage operations
   */
  interface FileStorageOptions extends StorageOptions {
    /** File metadata */
    metadata?: FileMetadata;
    /** Format to convert the image to (jpeg, png) */
    format?: 'jpeg' | 'png';
    /** Quality for image compression (0.0 - 1.0) */
    quality?: number;
  }

  /**
   * Result of a file retrieval operation
   */
  interface FileResult {
    /** The file data as a Uint8Array */
    data: Uint8Array;
    /** Metadata associated with the file */
    metadata?: FileMetadata;
  }

  /**
   * Result of an image retrieval operation
   */
  interface ImageResult {
    /** Data URI that can be used directly with Image components */
    uri: string;
    /** Metadata associated with the image */
    metadata?: FileMetadata;
  }

  /**
   * Information about a stored file
   */
  interface StoredFileInfo {
    /** The key used to store the file */
    key: string;
    /** Metadata associated with the file */
    metadata?: FileMetadata;
    /** Size of the file in bytes */
    size?: number;
  }

  /**
   * Utility for storing and retrieving files and images
   */
  class FileStorage {
    /**
     * Store a file from a URI
     * @param key The key to store the file under
     * @param uri URI of the file to store
     * @param options Storage options including metadata and compression
     */
    static storeFile(key: string, uri: string, options?: FileStorageOptions): Promise<void>;

    /**
     * Retrieve a stored file
     * @param key The key the file was stored under
     * @returns The file data and metadata
     */
    static getFile(key: string): Promise<FileResult>;

    /**
     * Store an image from a URI
     * @param key The key to store the image under
     * @param uri URI of the image to store
     * @param options Storage options including format, quality, and metadata
     */
    static storeImage(key: string, uri: string, options?: FileStorageOptions): Promise<void>;

    /**
     * Retrieve a stored image as a data URI
     * @param key The key the image was stored under
     * @returns The image as a data URI and metadata
     */
    static getImage(key: string): Promise<ImageResult>;

    /**
     * Save a stored file to the filesystem
     * @param key The key the file was stored under
     * @param destinationPath Path to save the file to
     * @returns The path where the file was saved
     */
    static saveToFilesystem(key: string, destinationPath: string): Promise<string>;

    /**
     * List all stored files
     * @param prefix Optional prefix to filter files by
     * @returns Array of stored file information
     */
    static listFiles(prefix?: string): Promise<StoredFileInfo[]>;

    /**
     * Delete a stored file
     * @param key The key the file was stored under
     */
    static deleteFile(key: string): Promise<void>;

    /**
     * Get the size of a stored file in bytes
     * @param key The key the file was stored under
     * @returns The size of the file in bytes
     */
    static getFileSize(key: string): Promise<number>;
  }

  export default PureStorage;
} 