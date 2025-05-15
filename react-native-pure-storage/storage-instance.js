import { NativeModules } from 'react-native';
import { createCache, createNullCache } from './cache';
import { StorageError, KeyError, SyncOperationError } from './errors';

const { RNPureStorage } = NativeModules;

// Utility functions for serialization/deserialization
const serializeValue = (value) => {
  if (value === null || value === undefined) {
    return { type: 'null', value: null };
  }
  
  const type = typeof value;
  
  switch (type) {
    case 'string':
      return { type, value };
    case 'number':
    case 'boolean':
      return { type, value: String(value) };
    case 'object':
      try {
        return { type, value: JSON.stringify(value) };
      } catch (e) {
        throw new Error(`Could not serialize value: ${e.message}`);
      }
    default:
      throw new Error(`Unsupported value type: ${type}`);
  }
};

const deserializeValue = (item) => {
  if (!item || !item.type) {
    return null;
  }
  
  switch (item.type) {
    case 'null':
      return null;
    case 'string':
      return item.value;
    case 'number':
      return Number(item.value);
    case 'boolean':
      return item.value === 'true';
    case 'object':
      try {
        return JSON.parse(item.value);
      } catch (e) {
        return null;
      }
    default:
      return item.value;
  }
};

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_OPTIONS = {
  maxSize: 100,
  ttl: 60000 // 1 minute TTL
};

/**
 * A storage instance with its own namespace and configuration
 */
export class StorageInstance {
  /**
   * Create a new storage instance
   * @param {Object} options - Instance options
   * @param {string} options.namespace - The namespace prefix for all keys
   * @param {boolean} options.encrypted - Whether to encrypt all data by default
   * @param {Object|boolean} options.cache - Cache configuration or false to disable
   */
  constructor(options = {}) {
    const { 
      namespace = 'default',
      encrypted = false,
      cache = DEFAULT_CACHE_OPTIONS
    } = options;
    
    this.namespace = namespace;
    this.encrypted = encrypted;
    
    // Setup cache
    this.cache = cache === false 
      ? createNullCache()
      : createCache(cache === true ? DEFAULT_CACHE_OPTIONS : cache);
    
    // Event handlers
    this._changeHandlers = new Set();
    this._keyHandlers = new Map();
  }
  
  /**
   * Get a namespaced key
   * @param {string} key - The original key
   * @returns {string} The namespaced key
   * @private
   */
  _getNamespacedKey(key) {
    return `${this.namespace}:${key}`;
  }
  
  /**
   * Emit a change event
   * @param {string} eventType - The type of event
   * @param {string} key - The key that changed
   * @param {any} value - The new value
   * @private
   */
  _emitChange(eventType, key, value) {
    const event = { type: eventType, key, value };
    
    // Notify global handlers
    for (const handler of this._changeHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in storage change handler:', error);
      }
    }
    
    // Notify key-specific handlers
    if (this._keyHandlers.has(key)) {
      for (const handler of this._keyHandlers.get(key)) {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in handler for key "${key}":`, error);
        }
      }
    }
  }
  
  /**
   * Store a value for a given key
   * @param {string} key - The key to store the value under
   * @param {any} value - The value to store
   * @param {Object} options - Optional configuration
   * @param {boolean} options.encrypted - Whether to encrypt the data
   * @param {boolean} options.skipCache - Whether to skip the cache
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  async setItem(key, value, options = {}) {
    if (typeof key !== 'string') {
      throw new KeyError('Key must be a string');
    }
    
    const namespacedKey = this._getNamespacedKey(key);
    const encrypted = options.encrypted ?? this.encrypted;
    
    try {
      const serialized = serializeValue(value);
      
      // Store in cache if caching is enabled
      if (!options.skipCache) {
        this.cache.set(key, value);
      }
      
      const success = await RNPureStorage.setItem(
        namespacedKey,
        serialized.type,
        serialized.value,
        encrypted
      );
      
      // Emit change event if successful
      if (success) {
        this._emitChange('set', key, value);
      }
      
      return success;
    } catch (error) {
      throw new StorageError(`Failed to set item: ${error.message}`, 'SET_ERROR');
    }
  }
  
  /**
   * Synchronously store a value for a given key (when available)
   * @param {string} key - The key to store the value under
   * @param {any} value - The value to store
   * @param {Object} options - Optional configuration
   * @param {boolean} options.encrypted - Whether to encrypt the data
   * @param {boolean} options.skipCache - Whether to skip the cache
   * @returns {boolean} - true if successful
   * @throws {SyncOperationError} If synchronous API is not available
   */
  setItemSync(key, value, options = {}) {
    if (typeof key !== 'string') {
      throw new KeyError('Key must be a string');
    }
    
    if (!RNPureStorage.setItemSync) {
      throw new SyncOperationError();
    }
    
    const namespacedKey = this._getNamespacedKey(key);
    const encrypted = options.encrypted ?? this.encrypted;
    
    try {
      const serialized = serializeValue(value);
      
      // Store in cache if caching is enabled
      if (!options.skipCache) {
        this.cache.set(key, value);
      }
      
      const success = RNPureStorage.setItemSync(
        namespacedKey,
        serialized.type,
        serialized.value,
        encrypted
      );
      
      // Emit change event if successful
      if (success) {
        this._emitChange('set', key, value);
      }
      
      return success;
    } catch (error) {
      throw new StorageError(`Failed to set item synchronously: ${error.message}`, 'SET_ERROR');
    }
  }
  
  /**
   * Get a value for a given key
   * @param {string} key - The key to retrieve the value for
   * @param {Object} options - Optional configuration
   * @param {boolean} options.skipCache - Whether to skip the cache
   * @param {any} options.default - Default value if the key doesn't exist
   * @returns {Promise<any>} - A promise that resolves to the stored value, or null if not found
   */
  async getItem(key, options = {}) {
    if (typeof key !== 'string') {
      throw new KeyError('Key must be a string');
    }
    
    // Check cache first if caching is enabled
    if (!options.skipCache) {
      const cachedValue = this.cache.get(key);
      if (cachedValue !== undefined) {
        return cachedValue;
      }
    }
    
    try {
      const namespacedKey = this._getNamespacedKey(key);
      const result = await RNPureStorage.getItem(namespacedKey);
      
      // Return default value if the key doesn't exist and a default is provided
      if (!result && options.default !== undefined) {
        return options.default;
      }
      
      const value = result ? deserializeValue(result) : null;
      
      // Cache the result if it's not null and caching is enabled
      if (value !== null && !options.skipCache) {
        this.cache.set(key, value);
      }
      
      return value;
    } catch (error) {
      // Return default if provided when an error occurs
      if (options.default !== undefined) {
        return options.default;
      }
      throw new StorageError(`Failed to get item: ${error.message}`, 'GET_ERROR');
    }
  }
  
  /**
   * Synchronously get a value for a given key (when available)
   * @param {string} key - The key to retrieve the value for
   * @param {Object} options - Optional configuration
   * @param {boolean} options.skipCache - Whether to skip the cache
   * @param {any} options.default - Default value if the key doesn't exist
   * @returns {any} - The stored value, or null if not found
   * @throws {SyncOperationError} If synchronous API is not available
   */
  getItemSync(key, options = {}) {
    if (typeof key !== 'string') {
      throw new KeyError('Key must be a string');
    }
    
    // Check cache first if caching is enabled
    if (!options.skipCache) {
      const cachedValue = this.cache.get(key);
      if (cachedValue !== undefined) {
        return cachedValue;
      }
    }
    
    if (!RNPureStorage.getItemSync) {
      // Return default if available
      if (options.default !== undefined) {
        return options.default;
      }
      throw new SyncOperationError();
    }
    
    try {
      const namespacedKey = this._getNamespacedKey(key);
      const result = RNPureStorage.getItemSync(namespacedKey);
      
      // Return default value if the key doesn't exist and a default is provided
      if (!result && options.default !== undefined) {
        return options.default;
      }
      
      const value = result ? deserializeValue(result) : null;
      
      // Cache the result if it's not null and caching is enabled
      if (value !== null && !options.skipCache) {
        this.cache.set(key, value);
      }
      
      return value;
    } catch (error) {
      // Return default if provided when an error occurs
      if (options.default !== undefined) {
        return options.default;
      }
      throw new StorageError(`Failed to get item synchronously: ${error.message}`, 'GET_ERROR');
    }
  }
  
  /**
   * Remove a value for a given key
   * @param {string} key - The key to remove
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  async removeItem(key) {
    if (typeof key !== 'string') {
      throw new KeyError('Key must be a string');
    }
    
    // Remove from cache
    this.cache.remove(key);
    
    try {
      const namespacedKey = this._getNamespacedKey(key);
      const success = await RNPureStorage.removeItem(namespacedKey);
      
      // Emit change event if successful
      if (success) {
        this._emitChange('remove', key);
      }
      
      return success;
    } catch (error) {
      throw new StorageError(`Failed to remove item: ${error.message}`, 'REMOVE_ERROR');
    }
  }
  
  /**
   * Set multiple key-value pairs at once
   * @param {Object} keyValuePairs - Object with key-value pairs to store
   * @param {Object} options - Optional configuration
   * @param {boolean} options.encrypted - Whether to encrypt the data
   * @param {boolean} options.skipCache - Whether to skip the cache
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  async multiSet(keyValuePairs, options = {}) {
    if (!keyValuePairs || typeof keyValuePairs !== 'object') {
      throw new StorageError('Expected an object of key-value pairs', 'INVALID_ARGUMENT');
    }
    
    const encrypted = options.encrypted ?? this.encrypted;
    
    try {
      const serialized = Object.entries(keyValuePairs).map(([key, value]) => {
        if (typeof key !== 'string') {
          throw new KeyError('Keys must be strings');
        }
        
        // Store in cache if caching is enabled
        if (!options.skipCache) {
          this.cache.set(key, value);
        }
        
        const namespacedKey = this._getNamespacedKey(key);
        const serializedValue = serializeValue(value);
        return [namespacedKey, serializedValue.type, serializedValue.value];
      });
      
      const success = await RNPureStorage.multiSet(serialized, encrypted);
      
      // Emit change events if successful
      if (success) {
        for (const [key, value] of Object.entries(keyValuePairs)) {
          this._emitChange('set', key, value);
        }
      }
      
      return success;
    } catch (error) {
      throw new StorageError(`Failed to set multiple items: ${error.message}`, 'MULTI_SET_ERROR');
    }
  }
  
  /**
   * Get multiple values for a set of keys
   * @param {Array<string>} keys - Array of keys to retrieve
   * @param {Object} options - Optional configuration
   * @param {boolean} options.skipCache - Whether to skip the cache
   * @returns {Promise<Object>} - A promise that resolves to an object of key-value pairs
   */
  async multiGet(keys, options = {}) {
    if (!Array.isArray(keys)) {
      throw new StorageError('Expected an array of keys', 'INVALID_ARGUMENT');
    }
    
    // Check which keys are in the cache
    const result = {};
    const keysToFetch = [];
    const namespacedKeysMap = {};
    
    if (!options.skipCache) {
      for (const key of keys) {
        if (typeof key !== 'string') {
          throw new KeyError('Keys must be strings');
        }
        
        const cachedValue = this.cache.get(key);
        if (cachedValue !== undefined) {
          result[key] = cachedValue;
        } else {
          keysToFetch.push(key);
          const namespacedKey = this._getNamespacedKey(key);
          namespacedKeysMap[namespacedKey] = key;
        }
      }
    } else {
      // Skip cache, fetch all keys
      for (const key of keys) {
        if (typeof key !== 'string') {
          throw new KeyError('Keys must be strings');
        }
        
        keysToFetch.push(key);
        const namespacedKey = this._getNamespacedKey(key);
        namespacedKeysMap[namespacedKey] = key;
      }
    }
    
    // If all keys were in the cache, return the result
    if (keysToFetch.length === 0) {
      return result;
    }
    
    try {
      // Convert keys to namespaced keys
      const namespacedKeys = keysToFetch.map(key => this._getNamespacedKey(key));
      
      // Fetch from storage
      const fetchedResults = await RNPureStorage.multiGet(namespacedKeys);
      
      // Process results
      for (const [namespacedKey, value] of Object.entries(fetchedResults)) {
        const originalKey = namespacedKeysMap[namespacedKey];
        const deserializedValue = value ? deserializeValue(value) : null;
        
        result[originalKey] = deserializedValue;
        
        // Cache the result if it's not null and caching is enabled
        if (deserializedValue !== null && !options.skipCache) {
          this.cache.set(originalKey, deserializedValue);
        }
      }
      
      return result;
    } catch (error) {
      throw new StorageError(`Failed to get multiple items: ${error.message}`, 'MULTI_GET_ERROR');
    }
  }
  
  /**
   * Remove multiple keys and their values
   * @param {Array<string>} keys - Array of keys to remove
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  async multiRemove(keys) {
    if (!Array.isArray(keys)) {
      throw new StorageError('Expected an array of keys', 'INVALID_ARGUMENT');
    }
    
    try {
      // Remove from cache
      for (const key of keys) {
        if (typeof key !== 'string') {
          throw new KeyError('Keys must be strings');
        }
        
        this.cache.remove(key);
      }
      
      // Convert to namespaced keys
      const namespacedKeys = keys.map(key => this._getNamespacedKey(key));
      
      // Remove from storage
      const success = await RNPureStorage.multiRemove(namespacedKeys);
      
      // Emit change events if successful
      if (success) {
        for (const key of keys) {
          this._emitChange('remove', key);
        }
      }
      
      return success;
    } catch (error) {
      throw new StorageError(`Failed to remove multiple items: ${error.message}`, 'MULTI_REMOVE_ERROR');
    }
  }
  
  /**
   * Clear all stored values for this namespace
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  async clear() {
    try {
      // Clear cache
      this.cache.clear();
      
      // Get all keys for this namespace
      const allKeys = await this.getAllKeys();
      
      if (allKeys.length === 0) {
        return true;
      }
      
      // Convert to namespaced keys
      const namespacedKeys = allKeys.map(key => this._getNamespacedKey(key));
      
      // Remove all keys
      const success = await RNPureStorage.multiRemove(namespacedKeys);
      
      // Emit change event if successful
      if (success) {
        this._emitChange('clear');
      }
      
      return success;
    } catch (error) {
      throw new StorageError(`Failed to clear storage: ${error.message}`, 'CLEAR_ERROR');
    }
  }
  
  /**
   * Get all keys stored in this namespace
   * @returns {Promise<Array<string>>} - A promise that resolves to an array of keys
   */
  async getAllKeys() {
    try {
      const allKeys = await RNPureStorage.getAllKeys();
      const namespacePrefix = `${this.namespace}:`;
      
      // Filter keys for this namespace and remove the prefix
      return allKeys
        .filter(key => key.startsWith(namespacePrefix))
        .map(key => key.substring(namespacePrefix.length));
    } catch (error) {
      throw new StorageError(`Failed to get all keys: ${error.message}`, 'GET_KEYS_ERROR');
    }
  }
  
  /**
   * Check if a key exists in storage
   * @param {string} key - The key to check
   * @param {Object} options - Optional configuration
   * @param {boolean} options.skipCache - Whether to skip the cache
   * @returns {Promise<boolean>} - A promise that resolves to true if the key exists
   */
  async hasKey(key, options = {}) {
    if (typeof key !== 'string') {
      throw new KeyError('Key must be a string');
    }
    
    // Check cache first if caching is enabled
    if (!options.skipCache) {
      const cachedValue = this.cache.get(key);
      if (cachedValue !== undefined) {
        return true;
      }
    }
    
    try {
      const namespacedKey = this._getNamespacedKey(key);
      return await RNPureStorage.hasKey(namespacedKey);
    } catch (error) {
      throw new StorageError(`Failed to check if key exists: ${error.message}`, 'HAS_KEY_ERROR');
    }
  }
  
  /**
   * Add a listener for storage changes
   * @param {Function} callback - The callback to call when any value changes
   * @returns {Function} A function to remove the listener
   */
  onChange(callback) {
    if (typeof callback !== 'function') {
      throw new StorageError('Callback must be a function', 'INVALID_CALLBACK');
    }
    
    this._changeHandlers.add(callback);
    
    // Return a function to remove the listener
    return () => {
      this._changeHandlers.delete(callback);
    };
  }
  
  /**
   * Add a listener for changes to a specific key
   * @param {string} key - The key to watch
   * @param {Function} callback - The callback to call when the key changes
   * @returns {Function} A function to remove the listener
   */
  onKeyChange(key, callback) {
    if (typeof key !== 'string') {
      throw new KeyError('Key must be a string');
    }
    
    if (typeof callback !== 'function') {
      throw new StorageError('Callback must be a function', 'INVALID_CALLBACK');
    }
    
    if (!this._keyHandlers.has(key)) {
      this._keyHandlers.set(key, new Set());
    }
    
    this._keyHandlers.get(key).add(callback);
    
    // Return a function to remove the listener
    return () => {
      if (this._keyHandlers.has(key)) {
        this._keyHandlers.get(key).delete(callback);
        
        // Clean up empty handlers
        if (this._keyHandlers.get(key).size === 0) {
          this._keyHandlers.delete(key);
        }
      }
    };
  }
  
  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }
  
  /**
   * Reset cache statistics
   */
  resetCacheStats() {
    this.cache.resetStats();
  }
  
  /**
   * Configure the cache
   * @param {Object|boolean} options - Cache options or false to disable
   */
  configureCache(options) {
    if (options === false) {
      this.cache = createNullCache();
    } else {
      this.cache = createCache(options === true ? DEFAULT_CACHE_OPTIONS : options);
    }
  }
} 